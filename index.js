
require('dotenv').config()
const middleware = require('./middleware')
const puppeteer = require('puppeteer-core');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000
// config 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(middleware)

app.get('/', (req, res) => {
    // return  view form input ...
})

app.post('/', async (req, res) => {
    let { sku, size } = req.body
    try {
        const browser = await puppeteer.launch(
            {
                headless: true,
                executablePath: process.env.PATH_CHROME,
                // userDataDir: process.env.PATH_DATA_CHROME,
                args: [
                    '--incognito',
                    // '--ignore-certificate-errors',
                    // '--no-sandbox',
                    // '--disable-setuid-sandbox',
                    '--window-size=1920,1080',
                    // "--disable-accelerated-2d-canvas",
                    // "--disable-gpu"
                ],
    
            })
        console.log(`open brower`)
        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })
        await page.goto('https://sneakerbuzz.vn')
        console.log(`go to https://sneakerbuzz.vn`)
        await page.waitForSelector('input[type="search"]')
        await page.focus('input[type="search"]')
        await page.type('input[type="search"]', sku)
        await page.click('button.btn.icon-fallback-text')
        await page.waitForSelector('input[type="search"]')
        console.log(`find product and redirect to product purchase page`)
        const hrefProduct = await page.evaluate((sku) => {
            return new Promise((resolve, reject) => {
                const allProducts = [...document.querySelectorAll('p.text-center.product-sku')]
                let isHref = ''
                console.log(allProducts)
                if (allProducts.length >= 1) {
                    for (const isElement of allProducts) {
                        const isSku = isElement.textContent.trim()
                        console.log(isSku)
                        console.log(isSku.split(': ')[1], sku)
                        isSku.split(': ')[1] == sku ? isHref = isElement.previousElementSibling.querySelector('a').href : ''
                        console.log(isHref)
                    }
                    resolve(isHref)
                } else {
                    console.log('khong co san pham')
                    reject('')
                }
            })
                .catch(err => {
                    console.error(err)
                    return err
                })
        }, sku)
        console.log(`hrefProduct: ${hrefProduct}`)
        if (hrefProduct.trim() == '' || hrefProduct == null) {
            const results = {
                status: false,
                message: `Product Invalid !`
            }
            await browser.close()
            console.table(results)
            return results
        } else {
            await page.goto(hrefProduct)
            await page.waitForSelector('img')
            console.log(`redirected to ${hrefProduct}`)
            console.log(`start to check the product price`)
            const infoProduct = await page.evaluate((size) => {
                console.log(size)
                return new Promise((resolve, reject) => {
                    const title = document.querySelector('h1.title-product').textContent
                    let currentPrice = document.querySelector('span.price.product-price')
                    let oldPrice = document.querySelector('del.price.product-price-old.sale')
                    if (currentPrice.textContent.trim() == 'Liên hệ') {
                        resolve({
                            title,
                            message: `Sản phẩm này không dược báo giá cần phải liên hệ để mua !`,
                            currentPrice: 'Liên hệ'
                        })
                    }
                    currentPrice = currentPrice.textContent.replace(/,/g, '')
                    currentPrice = currentPrice.slice(0, currentPrice.length - 1);
                    currentPrice = +currentPrice
                    if (oldPrice) {
                        oldPrice = oldPrice.textContent.replace(/,/g, '')
                        oldPrice = oldPrice.slice(0, oldPrice.length - 1)
                        oldPrice = +oldPrice
                        const saleOff = Math.floor((oldPrice - currentPrice) / oldPrice * 100)
                        if (saleOff > 40 || currentPrice <= 725000) {
                            console.log(`Good Sale`)
                            resolve({
                                title,
                                message: `Mức giá tốt nên mua !`,
                                oldPrice,
                                saleOff,
                                currentPrice,
                                size
                            })
                        }
                    }
                    else
                        if (currentPrice <= 725000) {
                            console.log(`Good Sale`)
                            resolve({
                                title,
                                message: `Mức giá tốt nên mua !`, oldPrice,
                                currentPrice,
                                size
                            })
                        } else {
                            console.log(`Bad Sale`)
                            resolve({
                                title,
                                message: `Mức giá hiện tại không thích hợp để mua sản phẩm !`,
                                currentPrice
                            })
                        }
                })
                    .catch(err => {
                        console.log(err)
                        return err
                    })
            }, size
            )
            console.table(infoProduct)
            const buyProduct = await page.evaluate((size) => {
                return new Promise((resolve, reject) => {
                    const isSize = document.querySelector(`input#swatch-0-${size}`)
                    if (!isSize) {
                        reject({
                            status: false,
                            message: `This product is not available in this size: ${size}`
                        })
                    }
                    isSize.click()
                    const btnBuy = document.querySelector('button#add-to-cart')
                    if (btnBuy.trim() == 'Hết hàng') {
                        reject({
                            status: false,
                            message: `Hết hàng`
                        })
                    } else {
                        resolve({
                            status: true,
                            message: `Mua Ngay`
                        })
                    }
                })
                    .catch(err => {
                        console.error(err)
                        return err
                    })
            }, size)
            console.log(buyProduct)
            // ... await update...
        }
        await browser.close()
    } catch (error) {
        console.log(error)
    }
})

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`)
})