const axios = require('axios')
const chalk = require('chalk')
const oauthSignature = require('oauth-signature')
const log = console.log

const { routes } = require('./routes')
const { isObjEmpty } = require('./helpers')
const { new0AuthParameters } = require('./0AuthParameters')

// Get list of all forms from GF
async function getForms(api, baseUrl) {
    const authParams = new0AuthParameters(api.key)

    try {
        const signature = oauthSignature.generate(
            'GET',
            baseUrl + routes.wp + routes.gf + routes.forms,
            authParams,
            api.secret
        )

        let result = await axios.get(
            baseUrl + routes.wp + routes.gf + routes.forms,
            {
                responseType: 'json',
                params: {
                    ...authParams,
                    oauth_signature: signature,
                },
            }
        )
    } catch (err) {
        apiErrorHandler(err)
        // Kill the plugin
        return false
    }

    return result.data
}

// Get form fields from GF
async function getFormFields(api, baseUrl, form) {
    let authParams = new0AuthParameters(api.key)

    const apiURL =
        baseUrl + routes.wp + routes.gf + routes.forms + '/' + form.id

    // Make a new signature
    const signature = oauthSignature.generate(
        'GET',
        apiURL,
        authParams,
        api.secret
    )

    try {
        let result = await axios.get(
            baseUrl + routes.wp + routes.gf + routes.forms + '/' + form.id,
            {
                responseType: 'json',
                params: {
                    ...authParams,
                    oauth_signature: signature,
                },
            }
        )
    } catch (err) {
        apiErrorHandler(err)
        // Kill the plugin
        return false
    }

    result.data['apiURL'] = apiURL

    return result.data
}

async function getFormsAndFields(api, baseUrl) {
    let formObj = {}

    // First get forms in list
    let allForms = await getForms(api, baseUrl)

    if (!isObjEmpty(allForms)) {
        for (const [key, value] of Object.entries(allForms)) {
            // Clone form object
            let currentForm = { ...allForms[key] }

            // remove unneeded key
            delete currentForm.entries

            let form = await getFormFields(api, baseUrl, currentForm)

            formObj['form-' + currentForm.id] = form
        }
    } else {
        log(chalk.red('We could not find any forms. Have you made any?'))
    }

    return formObj
}

function apiErrorHandler(error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        log(chalk.red('Request was made, but there was an issue'))
        log(error.response.data)
        log(error.response.status)
        log(error.response.headers)
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        log(chalk.red('Request was made, but no response'))
        log(error.request)
    } else {
        // Something happened in setting up the request that triggered an Error
        log(chalk.red('Something happened setting up the request'))
        log('Error', error.message)
    }
}

module.exports = {
    getFormsAndFields,
}
