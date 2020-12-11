#! /usr/bin/env node

const { default: Axios } = require('axios');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
})

readline.question('What would you like to log today?', async (item) => {
    const { data } = await Axios.get(`http://localhost:3001/food`)
    const it = data[Symbol.iterator]();
    
    console.log(item);
    readline.close()
})