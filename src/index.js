'use strict';

const Delay = require('@emartech/delay-js');
const yargs = require('yargs');
const resourceCheckers = require('./resource-checkers');

const defaultTimeout = 120000;
const defaultCheckInterval = 500;

const args = yargs
  .array('pg')
  .array('mysql')
  .array('rabbit')
  .array('redis')
  .array('mongo')
  .array('url')
  .array('healthcheck')
  .number('timeout')
  .number('interval')
  .argv;

const timeout = args.timeout || defaultTimeout;
const checkInterval = args.interval || defaultCheckInterval;

async function awaitResource(resourceType, resourceName) {
  const checkResource = resourceCheckers[resourceType];

  if (!resourceName) {
    return;
  }
  if (!checkResource) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  let timeoutHandle = setTimeout(() => {
    throw new Error('timeout reached');
  }, timeout);
  let isReady = await checkResource(resourceName);
  while (!isReady) {
    await Delay.wait(checkInterval);
    isReady = await checkResource(resourceName);
  }
  clearTimeout(timeoutHandle);
  console.log(`${resourceName} is up`);
}

async function awaitResourceType(resourceType) {
  const resourceNames = args[resourceType];
  if (!resourceNames) {
    return;
  }

  const pendingResourcePromises = resourceNames.map(resourceName => awaitResource(resourceType, resourceName));
  await Promise.all(pendingResourcePromises);
}

awaitResourceType('pg');
awaitResourceType('mysql');
awaitResourceType('rabbit');
awaitResourceType('redis');
awaitResourceType('mongo');
awaitResourceType('url');
awaitResourceType('healthcheck');
