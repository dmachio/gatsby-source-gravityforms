const axios = require('axios')
const chalk = require('chalk')

const { routes } = require('./routes')
const { isObjEmpty, slugify } = require('./helpers')
const btoa = require('btoa');

const log = console.log

// Get list of all forms from GF
async function getForms(basicAuth, api, baseUrl) {
    log(chalk.black.bgWhite('Fetching form ids'))

    let result

    try {
        result = await axios.get(
            baseUrl + routes.wp + routes.gf + routes.forms,
            {
                responseType: 'json',
                headers: {
                    Authorization: 'Basic ' + btoa(`${api.key}:${api.secret}`),
                },
                auth: basicAuth,
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
async function getFormFields(basicAuth, api, baseUrl, form) {
    log(chalk.black.bgWhite(`Fetching fields for form ${form.id}`))

    let result

    const apiURL =
        baseUrl + routes.wp + routes.gf + routes.forms + '/' + form.id

    try {
        result = await axios.get(
            baseUrl + routes.wp + routes.gf + routes.forms + '/' + form.id,
            {
                responseType: 'json',
                headers: {
                    Authorization: 'Basic ' + btoa(`${api.key}:${api.secret}`),
                },
                auth: basicAuth,
            }
        )
    } catch (err) {
        apiErrorHandler(err)
        // Kill the plugin
        return false
    }

    result.data['slug'] = slugify(form.title)
    result.data['apiURL'] = apiURL

    return result.data
}

async function getFormsAndFields(basicAuth, api, baseUrl, formsArgs) {
    let formObj = {}

    // First get forms in list
    let allForms = await getForms(basicAuth, api, baseUrl)

    // If there are forms to move with
    if (allForms) {
        if (!isObjEmpty(allForms)) {
            for (const [key, value] of Object.entries(allForms)) {
                // Clone form object
                let currentForm = { ...allForms[key] }

                let currentFormId = parseInt(currentForm.id)

                // If include is defined with form IDs, only include these form IDs.
                if ( formsArgs.include && !formsArgs.include.includes(currentFormId) ) {
                    continue
                }

                // If exclude is defined with form IDs, don't include these form IDs.
                if ( formsArgs.exclude && formsArgs.exclude.includes(currentFormId) ) {
                    continue
                }

                // remove unneeded key
                delete currentForm.entries

                let form = await getFormFields(
                    basicAuth,
                    api,
                    baseUrl,
                    currentForm
                )

                formObj['form-' + currentForm.id] = form
            }
        } else {
            log(chalk.bgRed('We could not find any forms. Have you made any?'))
        }

        return formObj
    }
    return false
}

function apiErrorHandler(error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        log(chalk.bgRed('Request was made, but there was an issue'))
        log(error.response.data)
        log(error.response.status)
        log(error.response.headers)
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        log(chalk.bgRed('Request was made, but no response'))
        log(error.request)
    } else {
        // Something happened in setting up the request that triggered an Error
        log(chalk.bgRed('Something happened setting up the request'))
        log('Error', error)
    }
}

module.exports = {
    getFormsAndFields,
}
