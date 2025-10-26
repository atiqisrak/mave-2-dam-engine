pm2 stop 10 && cd /var/www/jerry/oreo && git pull 
&& pnpm i && pnpm build && pm2 restart 10