var config=require('./dbconfig');
const sql=require('mssql')

const  getusers= async ()=>{
    try{
        let pool=await sql.connect(config);
        let users=await pool.request().query('select * from [User]');
        return users.recordsets;
    }catch(err){

        console.log(err);
    }
    
}
const adduser= async (user)=>{
    // console.log('user:',user);
    try{

        let pool=await sql.connect(config);
               let request=  pool.request();
               request.input('name',sql.NVarChar(50),user.name);
               request.input('password',sql.NVarChar(50),user.password);
               request.input('email',sql.NVarChar(50),user.email);

  const result = await request.query(`
      INSERT INTO [User] (name, email, password)
      VALUES (@name, @email, @password);
    `);

    console.log('✅ User inserted successfully.');
    return result;

    }catch(err){
console.error('❌ SQL error:', err);

    }
}


module.exports={
    getusers:getusers,
    adduser:adduser
}