const express = require("express")
const axios = require("axios")
const port = 9876
const window_size = 10
const numberwindow = []
const access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE4Nzc3ODAzLCJpYXQiOjE3MTg3Nzc1MDMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImNlYTM3NDNlLTBjYmQtNGMxNy1iOTJkLTMxYTdlZmQyYWQ1MiIsInN1YiI6IjIxMDMwNDEyNDQ2MkBwYXJ1bHVuaXZlcnNpdHkuYWMuaW4ifSwiY29tcGFueU5hbWUiOiJhZmZvcmRtZWQiLCJjbGllbnRJRCI6ImNlYTM3NDNlLTBjYmQtNGMxNy1iOTJkLTMxYTdlZmQyYWQ1MiIsImNsaWVudFNlY3JldCI6IlFmU2FjZG95bHpHaXpOR2IiLCJvd25lck5hbWUiOiJKYXN3YW50aFN1ZGhhIiwib3duZXJFbWFpbCI6IjIxMDMwNDEyNDQ2MkBwYXJ1bHVuaXZlcnNpdHkuYWMuaW4iLCJyb2xsTm8iOiIyMTAzMDQxMjQ0NjIifQ.QUGh22Pq6TwDOGoqOvdgvrBMVjM7ULwD-scf2Yxx7Sw"
let window = []
const app = express()
const URL_MAP = {
    'p': 'http://20.244.56.144/test/primes',
    'f': 'http://20.244.56.144/test/fibo',
    'e': 'http://20.244.56.144/test/even',
    'r': 'http://20.244.56.144/test/rand'
};
const fetchNumber = async (numberId) => {
    try {
        const url = URL_MAP[numberId]
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${access_token}`
            }


        })
        const json = await response.json()
        console.log(json)
        return json.numbers
    }
    catch (error) {
        console.error("Error")
    }
}
const updateWindow = (newNumber) => {
    const previousState = [...numberwindow]
    newNumber.forEach(num => {
        if (!numberwindow.includes(num)) {
            if (numberwindow.length >= window_size) {
                numberwindow.shift()
            }
            numberwindow.push(num)
        }
    })
    return { previousState, currentState: numberwindow }

}
const calculateAverage = (numbers) => {
    if (numbers.length == 0) return 0
    const sum = numbers.reduce((acc, num) => acc + num, 0)
    return parseFloat((sum / numbers.length).toFixed(2))
}
app.get("/numbers/:numberId", async (req, res) => {
    const { numberId } = req.params
    if (!['p', 'f', 'e', 'r'].includes(numberId)) {
        return res.status(400).json({ error: "Invalid Number Id" })
    }

    const newNumbers = await fetchNumber(numberId)
    const { previousState, currentState } = updateWindow(newNumbers)
    const average = calculateAverage(currentState)
    res.json({
        numbers: newNumbers,
        windowPrevS: previousState,
        windowCurrState: currentState,
        avg: average
    })
})
app.listen(port, () => {
    console.log("Listening on Port ", port)
})