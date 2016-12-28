#!/usr/bin/env node

// file system
var fs = require('fs');
var shell = require('shelljs');

var configPath = 'config-file/Language.json';
var outPutPath = 'outPut';

var xmlString = fs.readFileSync('config-file/values.xml','utf8');
var itemString = fs.readFileSync('config-file/item.xml','utf8');

//缓存的字符串，以语言为key存储文本信息
var cacheStrings = {};

var exists = function (path) {
  try {
    return fs.statSync(path,fs.F_OK);
  } catch (error) {
    return false;
  }
}

var rmDir = function (path) {
  var isExists = exists(path);
  if (isExists) {
    shell.exec('rm -rf '+path);//强制删除整个tmp文件夹
  }
}

var mkDir = function (path) {
  var isExists = exists(path);
  if (isExists == false) {
    shell.exec('mkdir -p '+path);
  }
}

//读取多语言配置文件
var readConfigFile = function () {
  var config = JSON.parse(fs.readFileSync(configPath));
  return config;
}

var fill_XML = function (lan, key, value){
  //已经缓存的字符串
  var cached_str = cacheStrings[lan];
  if(cached_str == undefined){
    cached_str = "";
  }
  //单项的文本，分别修改key和value
  var item = itemString.replace(/\{key\}/, key);
  item = item.replace(/\{value\}/, value);
  //拼接字符串并缓存
  cached_str = cached_str + item + "\n    ";
  cacheStrings[lan] = cached_str;
}

var formateLanguage = function(lan, key, value){
  //中文特殊处理
  if (lan == "zhs") {
    //简体中文
    lan = "zh-rCN";
    fill_XML(lan, key, value);
  }else if(lan == "zht"){
    //香港繁体
    lan = "zh-rHK";
    fill_XML(lan, key, value);
    //台湾繁体
    lan = "zh-rTW";
    fill_XML(lan, key, value);
  }else{
    fill_XML(lan, key, value);
  }
}

var begin = function () {
  //删除outPut目录下所有文件
  rmDir(outPutPath);

  //开始读取配置文件
  var config = readConfigFile();
  if (config === undefined) {
    return;
  }

  //根据配置信息生成缓存文本
  for (var key in config) {
    for (var lan in config[key]) {
      formateLanguage(lan, key, config[key][lan]);
    }
  }

  for (var lan in cacheStrings) {
    var element = cacheStrings[lan];
    createXML(lan, element);
  }
}

//创建xml文件
var createXML = function(lan, content){
  var pathStr = outPutPath + "/" + "values-" + lan
  var fileName = "values-" + lan + ".xml";
  mkDir(pathStr)
  var content_str = xmlString.replace(/value/, content)
  fs.writeFileSync(pathStr + "/" + fileName, content_str,'utf8')

  if (lan == "en") {
    //需要再生成一份默认的xml文件
    pathStr = outPutPath + "/" + "values"
    fileName = "values.xml";
    mkDir(pathStr)
    content_str = xmlString.replace(/value/, content)
    fs.writeFileSync(pathStr + "/" + fileName, content_str,'utf8')
  }
}

begin();