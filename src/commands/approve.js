/*global require*/
'use strict';
// approve --example="blue line" --page="hello-world"
// approve --all
//

const path = require('path'),
	fsPromise = require('../util/fs-promise'),
	validateRequiredParams = require('../util/validate-required-params'),
	arrayToObject = require('../util/array-to-object'),
	approveExample = require('../tasks/approve-example'),
	matchingName = function (objectName, expression) {
		return objectName === expression;
	},
	filterExamples = function (pageObj, expression) {
		const filteredPage = {
			pageName: pageObj.pageName,
			results: {}
		};
		Object.keys(pageObj.results)
			.filter(exampleName => matchingName(exampleName, expression))
			.forEach(matchedName => filteredPage.results[matchedName] = pageObj.results[matchedName]);
		return filteredPage;
	},
	approvePage = function (pageObj, examplesDir, resultsDir) {
		if (!pageObj.results) {
			return false;
		}
		const exampleNames = Object.keys(pageObj.results);
		console.log('ex names', exampleNames);
		return Promise.all(
				exampleNames.map(
					exampleName => approveExample(pageObj.pageName, pageObj.results[exampleName], examplesDir, resultsDir)
				)
			).then(() => exampleNames);
	};

module.exports = function approve(params) {
	let filteredPages;
	validateRequiredParams(params, ['examples-dir', 'results-dir', 'example', 'page']);
	return fsPromise.readFileAsync(path.join(params['results-dir'], 'summary.json'), 'utf8')
		.then(JSON.parse)
		.then(results =>
			results.pages
				.filter(page => matchingName(page.pageName, params.page))
				.map(page => filterExamples(page, params.example))
		)
		.then(pages => filteredPages = pages)
		.then(pages => Promise.all(pages.map(page => approvePage(page, params['examples-dir'], params['results-dir']))))
		.then(results => arrayToObject(results, filteredPages.map(page => page.pageName)));
};

module.exports.doc = {
	description: 'Approve a test result to become the expected value for subsequent runs',
	priority: 2,
	args: [
		{
			argument: 'page',
			optional: false,
			description: 'The name of the page containing the example to approve',
			example: 'hello-world'
		},
		{
			argument: 'example',
			optional: false,
			description: 'The name of the example to approve',
			example: 'blue line'
		},
		{
			argument: 'examples-dir',
			optional: true,
			description: 'The root directory for the example files',
			default: 'examples subdirectory of the current working directory',
			example: 'specs'
		},
		{
			argument: 'results-dir',
			optional: true,
			description: 'The output directory for results. Note - if it is an existing directory, the old contents will be removed.',
			default: 'results subdirectory in the current working directory',
			example: '/tmp/output'
		}
	]
};
