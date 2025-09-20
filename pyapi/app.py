# app.py
import jmcomic
from flask import Flask, request, abort, send_file
import os
import shutil
import logging
import threading
import time
import gc
import psutil
import tracemalloc
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Flask 初始化
app = Flask(__name__)

# 全局配置
JM_BASE_DIR = os.getenv('JM_BASE_DIR', 'C:/a/b/your/path')
EXCLUDE_FOLDER = os.getenv('JM_EXCLUDE_FOLDER', 'long')
EXCLUDE_FOLDER_PDF = os.getenv('JM_EXCLUDE_FOLDER_PDF', 'pdf')
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', '8000'))
JM_LOG_DIR = os.getenv('JM_LOG_DIR')
MEMORY_THRESHOLD = float(os.getenv('MEMORY_THRESHOLD', '80.0'))  # 内存使用百分比阈值

# 推导路径
IMAGE_FOLDER = os.path.join(JM_BASE_DIR, 'long')
PDF_FOLDER = os.path.join(JM_BASE_DIR, 'pdf')
OPTION_YML_PATH = os.path.join(JM_LOG_DIR if JM_LOG_DIR else JM_BASE_DIR, 'option.yml')

# 内存监控状态
memory_monitor_running = True

# 日志配置
def configure_logging():
    log_file_path = os.path.join(JM_LOG_DIR if JM_LOG_DIR else JM_BASE_DIR, 'app.log')
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file_path, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

# 文件夹清理函数
def cleanup_folders():
    """清理除指定文件夹外的所有目录"""
    if not os.path.exists(JM_BASE_DIR):
        logging.warning(f"目录不存在: {JM_BASE_DIR}")
        return

    for item in os.listdir(JM_BASE_DIR):
        item_path = os.path.join(JM_BASE_DIR, item)
        if os.path.isdir(item_path) and item not in [EXCLUDE_FOLDER, EXCLUDE_FOLDER_PDF]:
            try:
                shutil.rmtree(item_path)
                logging.info(f"已删除: {item_path}")
            except Exception as e:
                logging.error(f"删除失败: {item_path} - {str(e)}")

# 下载函数
def download_album(jm_id):
    """下载专辑并返回是否成功"""
    try:
        option = jmcomic.create_option_by_file(OPTION_YML_PATH)
        jmcomic.download_album(jm_id, option)
        return True
    except Exception as e:
        logging.error(f"下载失败: {str(e)}")
        return False

# 内存监控函数
def memory_monitor():
    """监控内存使用情况并在必要时触发垃圾回收"""
    global memory_monitor_running
    process = psutil.Process(os.getpid())
    
    # 启动内存跟踪
    tracemalloc.start()
    
    while memory_monitor_running:
        try:
            # 获取内存使用情况
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()
            
            # 记录内存使用情况
            logging.info(f"内存使用: {memory_info.rss / 1024 / 1024:.2f} MB ({memory_percent:.2f}%)")
            
            # 如果内存使用超过阈值，触发垃圾回收
            if memory_percent > MEMORY_THRESHOLD:
                logging.warning(f"内存使用超过阈值 ({memory_percent:.2f}% > {MEMORY_THRESHOLD}%)，触发垃圾回收")
                gc.collect()
                
                # 显示内存分配跟踪
                snapshot = tracemalloc.take_snapshot()
                top_stats = snapshot.statistics('lineno')
                
                logging.info("内存分配前10:")
                for stat in top_stats[:10]:
                    logging.info(f"  {stat}")
                
            # 每30秒检查一次
            time.sleep(30)
        except Exception as e:
            logging.error(f"内存监控错误: {str(e)}")
            time.sleep(60)  # 出错后等待更长时间

# 路由处理
@app.route('/jmd', methods=['GET'])
def get_image():
    jm_id = request.args.get('jm', type=int)
    if not jm_id or jm_id <= 0:
        abort(400, description="参数 jm 必须为正整数")

    image_path = os.path.join(IMAGE_FOLDER, f"{jm_id}.png")

    if not os.path.exists(image_path):
        if not download_album(jm_id):
            abort(503, description="下载失败")
        
        if not os.path.exists(image_path):
            abort(404, description="资源下载后仍未找到")

    return send_file(image_path, mimetype='image/png')

@app.route('/jmdp', methods=['GET'])
def get_pdf():
    jm_id = request.args.get('jm', type=int)
    if not jm_id or jm_id <= 0:
        abort(400, description="参数 jm 必须为正整数")

    pdf_path = os.path.join(PDF_FOLDER, f"{jm_id}.pdf")

    if not os.path.exists(pdf_path):
        if not download_album(jm_id):
            abort(503, description="下载失败")
        
        if not os.path.exists(pdf_path):
            abort(404, description="资源下载后仍未找到")

    return send_file(pdf_path, mimetype='application/pdf')

@app.route('/cleanup', methods=['POST'])
def cleanup():
    """手动触发清理"""
    cleanup_folders()
    return '清理完成'

@app.route('/memory', methods=['GET'])
def memory_info():
    """获取当前内存使用信息"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    memory_percent = process.memory_percent()
    
    return {
        'rss_mb': memory_info.rss / 1024 / 1024,
        'vms_mb': memory_info.vms / 1024 / 1024,
        'percent': memory_percent
    }

@app.route('/gc', methods=['POST'])
def trigger_gc():
    """手动触发垃圾回收"""
    collected = gc.collect()
    return f'垃圾回收完成，释放了 {collected} 个对象'

@app.route('/')
def return_status():
    return 'api running!'

# 主程序
if __name__ == '__main__':
    configure_logging()
    logging.info("服务启动，执行首次清理...")
    cleanup_folders()
    
    # 启动内存监控线程
    monitor_thread = threading.Thread(target=memory_monitor, daemon=True)
    monitor_thread.start()
    logging.info("内存监控线程已启动")
    
    try:
        app.run(
            host=FLASK_HOST,
            port=FLASK_PORT,
            debug=False,
            use_reloader=False
        )
    except KeyboardInterrupt:
        logging.info("接收到中断信号，停止服务...")
    finally:
        # 停止内存监控
        memory_monitor_running = False
        monitor_thread.join(timeout=5)
        logging.info("服务已停止")