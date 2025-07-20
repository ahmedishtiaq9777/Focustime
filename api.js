var dboperations=require('./dboperations');
var User=require('./user');

dboperations.getusers().then(result=>{
    console.log(result[0])
})