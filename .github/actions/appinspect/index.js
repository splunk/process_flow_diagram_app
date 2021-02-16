const core = require('@actions/core');
const axios = require('axios')
var FormData = require('form-data');
var fs = require('fs');
const { report } = require('process');
const path = require('path');

const authURL = "https://api.splunk.com/2.0/rest/login/splunk"
const submitURL = "https://appinspect.splunk.com/v1/app/validate"

async function getToken() {
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

async function checkReport(token, requestID, reportPath) {
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

async function pollStatus(token, requestID) {
    const interval = 15000

    async function checkFinished() {
        const result = await checkStatus(token, requestID)
        console.log(result.status)
        if (result.status !== "SUCCESS") {
            setTimeout(checkFinished, interval)
        } else {
            return result
        }
    }
    return await checkFinished()
}


function poll(fn, token, requestID,timeout, interval) {
    var endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    var checkCondition = function(resolve, reject) { 
        var ajax = fn(token, requestID);
        // dive into the ajax promise
        ajax.then( function(response){
            // If the condition is met, we're done!
            console.log(response.status)

            if(response.status == "SUCCESS") {
                resolve(response.data);
            }
            // If the condition isn't met but the timeout hasn't elapsed, go again
            else if (Number(new Date()) < endTime) {
                setTimeout(checkCondition, interval, resolve, reject);
            }
            // Didn't match and too much time, reject!
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
    
    poll(checkStatus, token, requestID, 1000000, 10000).then(() =>{
        console.log("Done polling")
        checkReport(token, requestID, reportPath)
    }).catch(err => {
        console.log(err)
    })

}

run();