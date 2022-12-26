module.exports = function (req, res, next) {
    let { sku, size } = req.body
    if (sku && size) {
        sku = sku.trim()
        size = size.trim()
        if ((sku || size)  == '' || (sku || size)   == null) {
            return {
                status: 'error',
                message: 'The product does not exist or the size is incorrect !',
            }
        }
        req.body.sku = sku
        req.body.size = size
        next()
    } else {
        return res.status(404).json({
            status: 'error',
            message: 'Incorrect shoes name or sku code !'
        })
    }
}