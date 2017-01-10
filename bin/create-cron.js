var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    exec = require('child_process').exec,
    
    projectDir = process.cwd(),
    cronScript = util.format("* * * * * . %s/envvars.sh; %s/redeploy.sh >> %s/deploy.log 2>&1\n", projectDir, projectDir),
    cronScriptPath = path.join(projectDir, './cron_job');

fs.writeFileSync(cronScriptPath, cronScript);
exec('crontab ' + cronScriptPath, console.log.bind(console), console.log.bind(console));
