'use strict';

const axios = require('axios');
const { Docker, Options } = require('docker-cli-js');

const dockerOptions = new Options();
const docker = new Docker(dockerOptions);
const mysqlPassword = 'password';

const getContainerId = async name => {
  const { containerList } = await docker.command('ps');
  const container = containerList.find(container => container.names === name);
  const containerId = container['container id'];
  return containerId;
};

const isPostgresReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await docker.command(`exec ${containerId} pg_isready`);
    const isReady = result.raw.split('-')[1].trim() === 'accepting connections';
    return isReady;
  } catch (error) {
    return false;
  }
};

const isMysqlReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await docker.command(`exec ${containerId} mysqladmin status --password=${mysqlPassword}`);
    const uptimeData = result.raw.split('  ')[0].split(' ');
    const uptime = parseInt(uptimeData[1]);
    return uptimeData[0] === 'Uptime:' && uptime > 0;
  } catch (error) {
    return false;
  }
};

const isRabbitReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await docker.command(`exec ${containerId} rabbitmqctl status`);
    const uptime = parseInt(result.raw.split('{uptime,')[1].split('}')[0], 10);
    const listeners = result.raw.split('{listeners,[')[1].split(']')[0].split('},{').length;
    return uptime > 0 && listeners === 3;
  } catch (error) {
    return false;
  }
};

const isRedisReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await docker.command(`exec ${containerId} redis-cli PING`);
    return result.raw.trim() === 'PONG';
  } catch (error) {
    return false;
  }
};

const isMongoReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await docker.command(`exec ${containerId} mongo`);
    return result.raw.includes('MongoDB server version:');
  } catch (error) {
    return false;
  }
};

const checkUrl = async url => {
  try {
    await axios.get(url);
    return true;
  } catch (error) {
    return false;
  }
};

const checkHealthcheckRoute = async url => {
  try {
    const response = await axios.get(url);
    return response.data.success;
  } catch (error) {
    return false;
  }
};

module.exports = {
  pg: isPostgresReady,
  rabbit: isRabbitReady,
  redis: isRedisReady,
  mongo: isMongoReady,
  mysql: isMysqlReady,
  url: checkUrl,
  healthcheck: checkHealthcheckRoute
};
