
// import axios from 'axios';
// import { URL } from 'url';
// import fs from 'fs/promises';
import common from "../../../lib/common/common.js";
import path from 'path'; 
import {exec} from 'child_process';
const jm = /^#jm查(.*)$/
const Apirun = /^#jm(启动|重启)api$/
const Apitimerestart = /^#jm定时检查$/
const Apirestart = /^#jm检查api$/
export class ejm extends plugin {
    constructor() {
        super({
            name: 'ejm',
            dsc: 'jmsearch',
            event: 'message',
            priority: 1,
            rule: [{
                    reg: jm,
                    fnc: "Jm"
                },{
                  reg: Apirun,
                  fnc: "apirun",
                  permission: "master"
              },{
                reg: Apitimerestart,
                fnc: "apitimerestart",
                permission: "master"
            },{
              reg: Apirestart,
              fnc: "apirestart",
          },
            ]
        }
        )
    }
    async Jm(e) {
      let tup = "";
      for (let m of e.message) {
          tup += m.text;
      }
      tup = tup.replace(/#jm查/g, "").trim();
  
      // 构造请求URL
      let url = `http://127.0.0.1:8000/jmd?jm=${encodeURIComponent(tup)}`;
  
      try {
          // 发起请求
          let res = await fetch(url);
  
          // 检查请求是否成功
          if (!res || !res.ok) {
              logger.error('[jm] 请求失败');
              return await this.reply('错误，请检查车号或稍后重试！');
          }
  
          // 提取响应体为字符串
          const responseText = await res.text();
  
          // 检查响应体的字节大小
          const bytes = Buffer.byteLength(responseText, "utf8");
          console.log(`图片大小：${bytes}字节`);
          if (bytes >= 31457280) {
            let url = `http://127.0.0.1:8000/jmdp?jm=${encodeURIComponent(tup)}`;
            try{
              logger.warn('图片过大，将请求pdf下载并文件发送');
              
              let res = await fetch(url);
              if (!res || !res.ok) {
                logger.error('[jm] 请求失败');
                return await this.reply('错误，请检查车号或稍后重试！');
            }
              if(res.status == 200) console.log('状态ok')
              e.reply('文件拉取完成，耐心等待发送吧')
              if(!e.group){// 检测当前是否为群聊环境
                 await e.reply(e.friend.sendFile(`././plugins/jmcomic-plugin/resources/pdf/${tup}.pdf`)) 
              }else{
                 await e.reply(e.group.fs.upload(`././plugins/jmcomic-plugin/resources/pdf/${tup}.pdf`))

              }
              return true; 
            }catch(err){
               logger.error(err)
               return await this.reply('错误，请检查车号或稍后重试！');
            }
              
          }else{
       
          let msg = [segment.image(res.url)]; // 返回的是图片
          const forward = [
            '爱护jm，不要爬这么多本子，jm压力大你bot压力也大，西门',
            `https://18comic.vip/photo/${tup}`
        ];
          forward.push(msg);
          const fmsg = await common.makeForwardMsg(e, forward, `album${tup}`);
          await this.reply(fmsg);
        
          
    }
          return true; // 返回 true，阻挡消息不再往下
          } catch (err) {
          logger.error(`[jm] 请求失败：${err}`);
          return await this.reply('请求失败，请检查车号或稍后重试！');
      }
          }

      async apirun(e){
        const JM_PATH = path.join(path.resolve(), 'plugins', 'jmcomic-plugin');
        console.log(`获取工作路径:${JM_PATH}`);
        const PY_PATH = {
          pyapi: path.join(JM_PATH, 'pyapi', 'app.py'),
          resource: path.join(JM_PATH, 'resources')
        };
        const ppp = path.join(PY_PATH['pyapi']);
        console.log(ppp)
         exec(`python "${ppp}"`, (error) => {
          if (error) {
            console.error(`错误码: ${error.code}`);
           
            return false
          }
         
        });
        await e.reply('api启动完成！检查日志吧')
        return true
        }
      async apitimerestart(e){
        // 立即执行一次，然后每分钟执行
        checkTask();
        setInterval(checkTask, 60000);
        return await e.reply('设定完成，重启后失效')
      }
      async apirestart(e){
        try {
          console.log('执行检查，时间:', new Date().toLocaleTimeString());
          let url = 'http://127.0.0.1:8000'
          let res = await fetch(url);
          e.reply(`当前状态：${res.status}`)
          return true
        } catch (error) {
          console.error('检查任务出错:', error);
          console.warn('执行重启');
          e.reply('api未启动或意外关闭，执行重启')
          const JM_PATH = path.join(path.resolve(), 'plugins', 'jmcomic-plugin');
          console.log(`获取工作路径:${JM_PATH}`);
          const PY_PATH = {
          pyapi: path.join(JM_PATH, 'pyapi', 'app.py'),
          resource: path.join(JM_PATH, 'resources')
        };
          const ppp = path.join(PY_PATH['pyapi']);
          console.log(ppp)
           exec(`python "${ppp}"`, (error) => {
            if (error) {
              console.error(`错误码: ${error.code}`);
           
              return false
            }
           
          });

        }
      }
        
      }
  
      async function checkTask() {
        try {
          console.log('执行检查，时间:', new Date().toLocaleTimeString());
          let url = 'http://127.0.0.1:8000'
          let res = await fetch(url);
          console.log(`当前状态：${res.status}`)
        } catch (error) {
          console.error('检查任务出错:', error);
          console.warn('执行重启');
          const JM_PATH = path.join(path.resolve(), 'plugins', 'jmcomic-plugin');
          console.log(`获取工作路径:${JM_PATH}`);
          const PY_PATH = {
          pyapi: path.join(JM_PATH, 'pyapi', 'app.py'),
          resource: path.join(JM_PATH, 'resources')
        };
          const ppp = path.join(PY_PATH['pyapi']);
          console.log(ppp)
           exec(`python "${ppp}"`, (error) => {
            if (error) {
              console.error(`错误码: ${error.code}`);
           
              return false
            }
           
          });

        }
      }

  