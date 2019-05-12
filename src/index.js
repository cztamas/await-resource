'use strict';

const Delay = require('@emartech/delay-js');
const yargs = require('yargs');
const resourceCheckers = require('./resource-checkers');

const defaultTimeout = 120000;
const defaultCheckInterval = 500;

const args = yargs
  .array('pg')
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

const waitForResource = async (resourceType, resourceName) => {
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
};

const waitForResources = resourceType => {
  const resourceNames = args[resourceType];
  if (!resourceNames) {
    return;
  }
  resourceNames.map(resourceName => waitForResource(resourceType, resourceName));
};

waitForResources('pg');
waitForResources('rabbit');
waitForResources('redis');
waitForResources('mongo');
waitForResources('url');
waitForResources('healthcheck');
