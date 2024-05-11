# Запуск серевра:
использовать /builder/dist в качестве публичной папки сервера.

Для запуска сервера нужна только эта папка.
Например, php server:

  cd /dist
  
  php -S localhost:9090

# Запуск парсельки:
1. установить ноду:

Windows: https://nodejs.org/en/

Ubuntu:

  $ sudo apt install nodejs
  
  $ sudo apt install npm

2. Из корневой папки проекта (/builder, где лежит package.json):
  
  npm install parcel —save-dev
  
  npm install three
  
  npx parcel ./src/index.html
