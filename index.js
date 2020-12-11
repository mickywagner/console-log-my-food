#! /usr/bin/env node

const { default: Axios } = require("axios");

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "enter command > ",
});

readline.prompt();

readline.on("line", async (line) => {
  switch (line.trim()) {
    case "list vegan food":
      {
        const { data } = await Axios.get(`http://localhost:3001/food`);
        function* listVeganFoods() {
          let idx = 0;
          const veganOnly = data.filter((food) =>
            food.dietary_preferences.includes("vegan")
          );
          while (veganOnly[idx]) {
            yield veganOnly[idx];
            idx++;
          }
        }
        for (let val of listVeganFoods()) {
          console.log(val.name);
        }
        readline.prompt();
      }
      break;
    case "log": 
      const { data } = await Axios.get(`http://localhost:3001/food`);
      const it = data[Symbol.iterator]();
      let actionIt;

      function* actionGenerator() {
          const food = yield;
          const servingSize = yield askForServingSize()
          yield displayCalories(servingSize, food)
      }

      function askForServingSize(food) {
        readline.question(
          `How many servings did you eat? (as a decimal: 1, 0.5, 1.25, etc...) `,
          (servingSize) => {
            if (servingSize === "nevermind" || servingSize === "n") {
              actionIt.return();
            } else {
              actionIt.next(servingSize);
            }
          }
        );
      }

      async function displayCalories(servingSize = 1, food) {
        const calories = food.calories;
        console.log(
          `${
            food.name
          } with a serving size of ${servingSize} has ${Number.parseFloat(
            calories * parseInt(servingSize, 10)
          ).toFixed()} calories.`
        );
        const { data } = await Axios.get(`http://localhost:3001/users/1`);
        const usersLog = data.log || [];
        const putBody = {
          ...data,
          log: [
            ...usersLog,
            {
              [Date.now()]: {
                food: food.name,
                servingSize,
                calories: Number.parseFloat(
                  calories * parseInt(servingSize, 10)
                ),
              },
            },
          ],
        };
        await Axios.put(`http://localhost:3001/users/1`, putBody, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        actionIt.next();
        readline.prompt();
      }

      readline.question("What would you like to log today?", async (item) => {
        let position = it.next();
        while (!position.done) {
          const food = position.value.name;
          if (food === item) {
            console.log(`A single serving of ${item} has ${position.value.calories} calories.`);
            actionIt = actionGenerator()
            actionIt.next()
            actionIt.next(position.value);
          }
          position = it.next();
        }
        readline.prompt();
      });
      break;
    case `today's log`:
        readline.question('Email ', async emailAddress => {
            const { data } = await Axios.get(
                `http://localhost:3001/users?email=${emailAddress}`
            )
            const foodLog = data[0].log || []
            let totalCalories = 0

            function* getFoodLog() {
                yield* foodLog
            }
            
            for (const entry of getFoodLog()) {
                const timestamp = Object.keys(entry)[0]
                if(isToday(new Date(Number(timestamp)))) {
                    console.log(
                        `${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`,
                    )
                    totalCalories += entry[timestamp].calories
                }
            }
            console.log('----------------------')
            console.log(`Total Calories: ${totalCalories}`)
            readline.prompt()
        })
        break;
    }
  }
);

function isToday(timestamp) {
    const today = new Date()
    return (
        timestamp.getDate() === today.getDate() &&
        timestamp.getMonth() === today.getMonth() &&
        timestamp.getFullYear() === today.getFullYear()
    )
}
