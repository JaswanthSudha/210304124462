const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const redis = require('redis');

const app = express();
const port = 9876;
const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE4Nzc0Njc4LCJpYXQiOjE3MTg3NzQzNzgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImNlYTM3NDNlLTBjYmQtNGMxNy1iOTJkLTMxYTdlZmQyYWQ1MiIsInN1YiI6IjIxMDMwNDEyNDQ2MkBwYXJ1bHVuaXZlcnNpdHkuYWMuaW4ifSwiY29tcGFueU5hbWUiOiJhZmZvcmRtZWQiLCJjbGllbnRJRCI6ImNlYTM3NDNlLTBjYmQtNGMxNy1iOTJkLTMxYTdlZmQyYWQ1MiIsImNsaWVudFNlY3JldCI6IlFmU2FjZG95bHpHaXpOR2IiLCJvd25lck5hbWUiOiJKYXN3YW50aFN1ZGhhIiwib3duZXJFbWFpbCI6IjIxMDMwNDEyNDQ2MkBwYXJ1bHVuaXZlcnNpdHkuYWMuaW4iLCJyb2xsTm8iOiIyMTAzMDQxMjQ0NjIifQ.9_JQGcPkvg2WY9Vqe8NR16eKw9wJI7oN2wTl4uY7WWo"
const config = {
    headers: { Authorization: `Bearer ${access_token}` }
};
const client = redis.createClient();
client.on('error', (err) => console.log('Redis Client Error', err));
const ECOMMERCE_APIS = [
    "http://20.244.56.144/test/companies/AMZ",
    "http://20.244.56.144/test/companies/FLP",
    "http://20.244.56.144/test/companies/SNP",
    "http://20.244.56.144/test/companies/MYN",
    "http://20.244.56.144/test/companies/AZO"
];
function generateProductId(product) {
    const uniqueStr = `${product.company}_${product.id}`;
    return crypto.createHash('md5').update(uniqueStr).digest('hex');
}
async function fetchProductsFromApis(category) {
    const cacheKey = `products_${category}`;
    const cachedData = await client.get(cacheKey);

    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const productPromises = ECOMMERCE_APIS.map(api => axios.get(`${api}/categories/${category}/products`, config), {


    });
    const responses = await Promise.all(productPromises);

    let products = [];
    for (const response of responses) {
        if (response.status === 200 && response.data.products) {
            products = products.concat(response.data.products);
        }
    }

    await client.setEx(cacheKey, 3600, JSON.stringify(products));
    return products;
}
app.get('/categories/:categoryname/products', async (req, res) => {
    console.log("Hello")
    const category_name = req.params.categoryname;
    const n = parseInt(req.query.n) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort_by = req.query.sort_by || 'rating';
    const order = req.query.order || 'desc';

    try {
        const products = await fetchProductsFromApis(category_name);
        const sortedProducts = products.sort((a, b) => {
            if (order === 'asc') {
                return a[sort_by] > b[sort_by] ? 1 : -1;
            } else {
                return a[sort_by] < b[sort_by] ? 1 : -1;
            }
        });

        const start = (page - 1) * n;
        const end = start + n;
        const paginatedProducts = sortedProducts.slice(start, end);
        paginatedProducts.forEach(product => {
            product.unique_id = generateProductId(product);
        });

        res.json({
            products: paginatedProducts,
            total: products.length,
            page: page,
            page_size: n
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const category_name = req.params.categoryname;
    const product_id = req.params.productid;

    try {
        const products = await fetchProductsFromApis(category_name);
        console.log(products)

        const product = products.find(p => generateProductId(p) === product_id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});