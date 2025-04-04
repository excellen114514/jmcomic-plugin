import path from 'path'; 
import fs from 'fs'
const Writeenv = /^#jm路径写入$/
const Requirement = /^#jm安装依赖$/
export class ejm extends plugin {
    constructor() {
        super({
            name: 'ejm',
            dsc: 'jmenv',
            event: 'message',
            priority: 1,
            rule: [{
            reg: Writeenv,
            fnc: "write",
            permission: "master"
        },{
          reg: Requirement,
          fnc: "requirement",
          permission: "master"
      },
        ]
        }
        )
    }
    async write(e){
        const JM_PATH = path.join(path.resolve(), 'plugins', 'jmcomic-plugin');
                console.log(`获取工作路径:${JM_PATH}`);
                const PY_PATH = {
                  pyapi: path.join(JM_PATH, 'pyapi'),
                  resource: path.join(JM_PATH, 'resources')
                };
                const ppp = path.join(PY_PATH['pyapi']);
                const pppp = path.join(PY_PATH['resource']);
                console.log('api路径：',ppp);
                console.log('资源路径', pppp);
        await updateEnvVariable(
            'JM_BASE_DIR', 
            `${pppp}`, 
            path.join(ppp, '.env')
          );
        await updateEnvVariable(
            'JM_LOG_DIR', 
            `${ppp}`, 
            path.join(ppp, '.env')
          );
        await e.reply('写入完成，请留意控制台日志')
    }
    async requirement(e){
      const JM_PATH = path.join(path.resolve(), 'plugins', 'jmcomic-plugin');
              console.log(`获取工作路径:${JM_PATH}`);
              const PY_PATH = {
                pyapi: path.join(JM_PATH, 'pyapi'),
                resource: path.join(JM_PATH, 'resources')
              };
              const ppp = path.join(PY_PATH['pyapi']);
              const pppp = path.join(PY_PATH['resource']);
              console.log('api路径：',ppp);
              console.log('资源路径', pppp);
              try {
                await Bot.exec(`pip install -r ${ppp}/requirements.txt`)
              } catch (error) {
                await this.reply(`错误，报错情况为：${error}`)
              }
      
      return e.reply('api依赖安装完成，请留意控制台日志')
  }
}
async function updateEnvVariable(key, newValue, envPath) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const updated = content
      .split('\n')
      .map(line => {
        if (line.startsWith(key)) {
          const comment = line.split('#')[1] || '';
          return `${key}=${newValue}  # ${comment.trim()}`;
        }
        return line;
      });
    fs.writeFileSync(envPath, updated.join('\n'));
  }

