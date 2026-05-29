function calculatePoints(type, priority){

let points = 0;

/* Base points */

if(type === "report"){
points += 10;
}

if(type === "resolve"){
points += 20;
}

/* Priority bonus */

if(priority === "High"){
points += 5;
}

return points;

}

module.exports = calculatePoints;