const core = require('@actions/core');
const axios = require('axios')
var FormData = require('form-data');
var fs = require('fs');
const path = require('path');

async function getToken() {
    const authURL = "https://api.splunk.com/2.0/rest/login/splunk"

    try {
        const response = await axios({
            url: authURL,
            method: 'get',
            auth: {
                username: process.env.SPLUNK_USER,
                password: process.env.SPLUNK_PASS
            }
        })

        return response.data.data.token
    } catch (error) {
        console.log(error.response)
    }
}

async function submitApp(token, bundlePath) {
    const submitURL = "https://appinspect.splunk.com/v1/app/validate"
    var formData = new FormData();
    formData.append('app_package', fs.createReadStream(bundlePath));

    try {
        const response = await axios({
            url: submitURL,
            method: 'post',
            headers: {
                Authorization: `bearer ${token}`,
                ...formData.getHeaders()
            },
            data: formData
        })

        return response.data.request_id
    } catch (error) {
        console.log(error.response)
    }
}

async function checkStatus(token, requestID) {
    const statusURL = `https://appinspect.splunk.com/v1/app/validate/status/${requestID}`
    try {
        const response = await axios({
            url: statusURL,
            method: 'get',
            headers: {
                Authorization: `bearer ${token}`,
            }
        })
        return response.data
    } catch (error) {
        console.log(error.response)
    }

}

async function fetchReport(token, requestID, reportPath) {
    const reportURL = `https://appinspect.splunk.com/v1/app/report/${requestID}`

    try {
        const response = await axios({
            url: reportURL,
            method: 'get',
            headers: {
                Authorization: `bearer ${token}`,
                'Content-Type': 'text/html',
            }
        })
        fs.writeFile(path.join(reportPath, 'report.html'), response.data, (err) => {
            console.log(err)
        })
        return response.data

    } catch (error) {
        console.log(error.response)
    }

}

function pollStatus(fn, token, requestID, timeout, interval) {
    var endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    var checkCondition = function (resolve, reject) {
        var fetchStatus = fn(token, requestID);
        fetchStatus.then(function (response) {
            console.log(response.status)

            if (response.status == "SUCCESS") {
                console.log(response.info)
                resolve(response.data);
            }
            else if (Number(new Date()) < endTime) {
                setTimeout(checkCondition, interval, resolve, reject);
            }
            else {
                reject(new Error('timed out for ' + fn + ': ' + arguments));
            }
        });
    };

    return new Promise(checkCondition);
}

async function run() {
    const bundlePath = core.getInput('app-bundle');
    const reportPath = core.getInput('report-path');

    token = await getToken()
    requestID = await submitApp(token, bundlePath)

    pollStatus(checkStatus, token, requestID, 1000000, 10000).then(() => {
        fetchReport(token, requestID, reportPath)
    }).catch(err => {
        console.log(err)
    })

}

run();