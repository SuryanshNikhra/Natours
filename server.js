const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');

process.on('uncaughtException',(err)=>{
  console.log("uncaught exception exception occured shutting the system");
  console.log(err);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    
  })
  .then((con) => {
   // console.log(con.connections);
    console.log('DB connection successful!');
  });
//console.log(process.env);




const port = process.env.PORT || 3000;
const server= app.listen(port, () => {
  console.log(`listening to ${port}.....`);
});


process.on('unhandledRejection', (err) => {
  
  console.log("got some unhandled rejection error shutting the system");
  console.log(err);
  server.close(()=>{
    process.exit(1);
  });
}); 


