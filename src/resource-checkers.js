'use strict';

const axios = require('axios');
const { exec } = require('child_process');
const { cliTable2Json } = require('cli-table-2-json');

function executeScript(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, result, errorMessage) => {
      if (error) {
        return reject(errorMessage);
      }
      return resolve(result);
    });
  });
}

const mysqlPassword = process.env.MYSQL_ROOT_PASSWORD || 'password';

const getContainerId = async name => {
  const dockerPsOutput = await executeScript('docker ps');
  const rawContainerList = dockerPsOutput.split('\n').filter(Boolean);
  const containerList = cliTable2Json(rawContainerList);

  const container = containerList.find(container => container.names === name);
  const containerId = container['container id'];
  return containerId;
};

const isPostgresReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await executeScript(`docker exec ${containerId} pg_isready`);
    const isReady = result.split('-')[1].trim() === 'accepting connections';
    return isReady;
  } catch (error) {
    return false;
  }
};

const isMysqlReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await executeScript(`docker exec ${containerId} mysqladmin status --password=${mysqlPassword}`);
    const uptimeData = result.split('  ')[0].split(' ');
    const uptime = parseInt(uptimeData[1]);
    return uptimeData[0] === 'Uptime:' && uptime > 0;
  } catch (error) {
    return false;
  }
};

const isRabbitReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await executeScript(`docker exec ${containerId} rabbitmqctl status`);
    const uptime = parseInt(result.split('{uptime,')[1].split('}')[0], 10);
    const listeners = result.split('{listeners,[')[1].split(']')[0].split('},{').length;
    return uptime > 0 && listeners === 3;
  } catch (error) {
    return false;
  }
};

const isRedisReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await executeScript(`docker exec ${containerId} redis-cli PING`);
    return result.trim() === 'PONG';
  } catch (error) {
    return false;
  }
};

const isMongoReady = async name => {
  try {
    const containerId = await getContainerId(name);
    const result = await executeScript(`docker exec ${containerId} mongo`);
    return result.includes('MongoDB server version:');
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
