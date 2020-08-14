const fs = require('fs')
const chalk = require('chalk');
const fetch = require('node-fetch')
const log = console.log;
const config = JSON.parse(fs.readFileSync('./config.json'))

async function getCookies() {
    return new Promise(async (resolve, reject) => {
        const puppeteer = require('puppeteer-extra')
        const StealthPlugin = require('puppeteer-extra-plugin-stealth')();
        StealthPlugin.onBrowser = () => { };
        puppeteer.use(StealthPlugin);
        puppeteer.launch({ headless: true }).then(async browser => {
            const page = await browser.newPage()
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36');
            await page.goto("https://www.textnow.com/login")
            log(chalk.blue(`Useragent: ${await page.evaluate(() => navigator.userAgent)}`))
            await page.focus('#txt-username')
            await page.keyboard.type(config.username)
            await page.focus('#txt-password')
            await page.keyboard.type(config.password)
            await page.evaluate(({ config }) => {
                document.getElementById("btn-login").click();

            }, { config });
            await page.waitFor(5000)
            log(chalk.green(`Success!✨`))
            resolve(await page.cookies())
            await browser.close()
        }).catch(e => { console.log(e); reject('No cookies') })
    })
}


function formatCookies(cookieJson) {
    var cookie_str = ''
    for (var i = 0; i < cookieJson.length; i++)
        cookie_str += `${cookieJson[i].name} = ${cookieJson[i].value}; `
    return cookie_str
}

async function getUserName(cookies) {

    var response = await fetch("https://www.textnow.com/api/init", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "pragma": "no-cache",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-csrf-token": "cABT5tjS-Fe-mMWRG2q3Z9YnfdbNVWERfkTs",
            "x-requested-with": "XMLHttpRequest",
            "cookie": cookies
        },
        "referrer": "https://www.textnow.com/login",
        "method": "GET",
        "mode": "cors"
    });

    if (!response.ok) throw new Error(`Unexpected response ${await response.statusText} `)
    var u_name = JSON.parse(await response.text()).username
    log(chalk.greenBright("Got Internal Username:  " + u_name))
    return u_name;
}


async function sendMessage(cookies, u_name) {
    var response = await fetch("https://www.textnow.com/api/users/" + u_name + "/messages", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "pragma": "no-cache",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-csrf-token": "cABT5tjS-Fe-mMWRG2q3Z9YnfdbNVWERfkTs",
            "x-requested-with": "XMLHttpRequest",
            "cookie": cookies
        },
        "referrer": "https://www.textnow.com/messaging",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": "json=" + encodeURIComponent('{"contact_value":"' + config.contact + '","contact_type":2,"message":"' + Math.random() + '","read":1,"to_name":"' + config.contact + '","message_direction":2,"message_type":1,"from_name":"","has_video":false,"new":true,"date":"' + new Date() + '"}'),
        "method": "POST",
        "mode": "cors"
    });

    if (!response.ok) throw new Error(`Unexpected response ${await response.statusText} `)
    else log(chalk.greenBright("SUCCESS! " + JSON.stringify(await response.text())))
}


(async () => {
    log(chalk.greenBright('---------------------------------------'))
    log(chalk.green('Starting') + chalk.yellowBright("..."))
    log(chalk.cyan('Logging in...'))
    var cookies = formatCookies(await getCookies())
    log(chalk.magenta("Cookie: " + cookies));
    log(chalk.red("Getting Internal Username..."))
    var u_name = await getUserName(cookies);
    log(chalk.yellow("Sending Message..."));
    await sendMessage(cookies, u_name)
    log(chalk.greenBright('---------------------------------------'))
})()