const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const objectToCSV = require('objects-to-csv');

const camelize = (s) => s.replace(/-./g, (x) => x.toUpperCase()[1]);

const auditWebsite = async (website, i) => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  const runnerResult = await lighthouse(website, options);

  // `.lhr` is the Lighthouse Result as a JS object
  console.log('Report is done for', runnerResult.lhr.finalUrl);
  console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);

  const requiredAuditsNames = [
    'first-contentful-paint',
    'speed-index',
    'largest-contentful-paint',
    'interactive',
    'total-blocking-time',
    'cumulative-layout-shift',
  ];
  const requiredAudits = {};
  for (let i = 0; i < requiredAuditsNames.length; i++) {
    const auditName = requiredAuditsNames[i];
    requiredAudits[camelize(auditName)] = +runnerResult.lhr.audits[auditName].numericValue.toFixed(
      3,
    );
  }
  requiredAudits.performanceScore = runnerResult.lhr.categories.performance.score * 100;

  await chrome.kill();
  return requiredAudits;
};

const gatherData = async (website, count) => {
  const values = [];

  for (let i = 0; i < count; i++) {
    const performance = await auditWebsite(`https://ib-blog-${website}.netlify.app/page/1`, i);
    values.push(performance);
  }

  const csv = new objectToCSV(values);
  await csv.toDisk(`./ib-blog-${website}/data.csv`);
};

gatherData('gatsby', 100);
