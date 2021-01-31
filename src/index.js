'use strict';

const resourceCheckers = require('./resource-checkers');

const availableResourceTypes = Object.keys(resourceCheckers);
const defaultTimeout = 120000;
const defaultCheckInterval = 500;

async function awaitResource({ resourceType, resourceName, timeout, checkInterval }) {
  const checkResource = resourceCheckers[resourceType];

  if (!resourceName) {
    return;
  }
  if (!checkResource) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  let timeoutHandle = setTimeout(() => {
    throw new Error(`timeout reached waiting for ${resourceName}`);
  }, timeout);
  let isReady = await checkResource(resourceName);
  while (!isReady) {
    await wait(checkInterval);
    isReady = await checkResource(resourceName);
  }
  clearTimeout(timeoutHandle);
  console.log(`${resourceName} is up`);
}

module.exports = async function awaitResources(args) {
  const timeout = args.timeout || defaultTimeout;
  const checkInterval = args.interval || defaultCheckInterval;

  const resourceTypePromises = availableResourceTypes.map(async resourceType => {
    const resourceNames = args[resourceType];
    if (!resourceNames) {
      return;
    }

    const resourcePromises = resourceNames.map(
      resourceName => awaitResource({ resourceType, resourceName, timeout, checkInterval })
    );
    return Promise.all(resourcePromises);
  });

  return Promise.all(resourceTypePromises);
};

function wait(intervalInMs) {
  return new Promise(resolve => setTimeout(resolve, intervalInMs));
}
