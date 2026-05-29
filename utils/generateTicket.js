function generateTicket(){

const year = new Date().getFullYear();

const randomNumber = Math.floor(1000 + Math.random() * 9000);

const ticketId = `NV-${year}-${randomNumber}`;

return ticketId;

}

module.exports = generateTicket;