const sax = require("sax");
const fs = require("fs");
const mongoose = require("mongoose");
const EntityModel = require("./entityModel");
const GSTStatusModel = require("./gstModel");
const AddressModel = require("./addressModel");
// MongoDB connection URI
const uri = process.env.DATABASE; // Replace 'yourDatabaseName' with your actual database name
// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
// Event handlers for MongoDB connection
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB database successfully!");
  // Continue with the rest of the code here
});
// Create a SAX parser
const parser = sax.createStream(true);
// Initialize variables to store extracted data
let entities = [];
let currentEntity = {};
// Maintain a stack to handle nested elements
let entityStack = [];
//Event handlers for SAX parser
// parser.on('opentag', function(node) {
//     // Start of a new entity
//     if (node.name === 'ABR') {
//         currentEntity = {};
//     } else if (node.name === 'GST') {
//         // Start of a new GST status
//         currentGSTStatus = new GSTStatusModel(); // Create a new instance of GSTStatusModel
//         currentGSTStatus.status = node.attributes.status;
//         currentGSTStatus.GSTStatusFromDate = node.attributes.GSTStatusFromDate;
//     }
//     if (nestedKey === 'BusinessAddress') {
//         // For BusinessAddress, create an instance of AddressModel
//         let address = new AddressModel();
//         address.State = node.children[0].children[0].text;
//         address.Postcode = node.children[0].children[1].text;
//         parentEntity[nestedKey] = address;
//     }
//     else if (entityStack.length > 0) {
//         // If nested entity, add attributes as key-value pairs to nested object
//         let nestedKey = node.name;
//         let parentEntity = entityStack[entityStack.length - 1];
//         let nestedObject = {};
//         for (let attr in node.attributes) {
//             nestedObject[attr] = node.attributes[attr];
//         }
//         if (parentEntity[nestedKey]) {
//             // If it does, make it an array if it's not already
//             if (!Array.isArray(parentEntity[nestedKey])) {
//                 parentEntity[nestedKey] = [parentEntity[nestedKey]];
//             }
//             // Push the new nested entity
//             parentEntity[nestedKey].push(nestedObject);
//         } else {
//             // If it doesn't, set it as an object
//             parentEntity[nestedKey] = nestedObject;
//         }
//         //currentEntity[nestedKey] = nestedObject;
//     } else {
//         // If top-level entity, add attributes as key-value pairs to current entity
//         for (let attr in node.attributes) {
//             currentEntity[attr] = node.attributes[attr];
//         }
//     }
//     // Push the current entity to the stack
//     entityStack.push(currentEntity);
// });
// parser.on('text', function(text) {
//     // Add text content to current entity
//     if (entityStack.length > 0) {
//         let parentEntity = entityStack[entityStack.length - 1];
//         let nestedKey = Object.keys(parentEntity).pop();
//         parentEntity[nestedKey] = text.trim();
//     }
// });
// parser.on('closetag', function(tag) {
//     // End of entity
//     if (tag === 'ABR') {
//         // If there are nested entities, restore the previous entity from the stack
//         if (entityStack.length > 1) {
//             let parentEntity = entityStack.pop();
//             let nestedKey = Object.keys(parentEntity).pop();
//             let nestedEntity = parentEntity[nestedKey];
//             parentEntity[nestedKey] = [nestedEntity];
//             currentEntity = parentEntity;
//         }
//         // else {
//         //     currentEntity = entityStack.pop();
//         // }
//         entities.push(currentEntity);
//     }
// });

parser.on("opentag", function (node) {
  // Start of a new entity
  if (node.name === "ABR") {
    currentEntity = {};
  } else if (node.name === "GST") {
    currentEntity.GST = new GSTStatusModel({
        status: node.attributes.status,
        GSTStatusFromDate: node.attributes.GSTStatusFromDate
    });
  } else if (entityStack.length > 0) {
    // If nested entity, add attributes as key-value pairs to nested object
    let nestedKey = node.name;
    let parentEntity = entityStack[entityStack.length - 1];
    let nestedObject = {};
    for (let attr in node.attributes) {
      nestedObject[attr] = node.attributes[attr];
    }
    if (nestedKey === "BusinessAddress") {
      let address = new AddressModel();
      let stateNode = node?.children?.[0]?.children?.find(
        (child) => child.name === "State"
      );
      let postcodeNode = node?.children?.[0]?.children?.find(
        (child) => child.name === "Postcode"
      );

      // Check if State node exists and has a text content
      if (stateNode && stateNode.children[0] && stateNode.children[0].text) {
        address.State = stateNode.children[0].text;
      } else {
        address.State = ""; // Set a default value or handle the case where State node is missing
      }

      // Check if Postcode node exists and has a text content
      if (
        postcodeNode &&
        postcodeNode.children[0] &&
        postcodeNode.children[0].text
      ) {
        address.Postcode = postcodeNode.children[0].text;
      } else {
        address.Postcode = ""; // Set a default value or handle the case where Postcode node is missing
      }

      // Set the address object to the parentEntity
      parentEntity[nestedKey] = address;
    } else {
      parentEntity[nestedKey] = nestedObject;
    }
  } else {
    // If top-level entity, add attributes as key-value pairs to current entity
    for (let attr in node.attributes) {
      currentEntity[attr] = node.attributes[attr];
    }
  }

  // Push the current entity to the stack
  entityStack.push(currentEntity);
});

parser.on("text", function (text) {
  // Add text content to current entity
  if (entityStack.length > 0) {
    let parentEntity = entityStack[entityStack.length - 1];
    let nestedKey = Object.keys(parentEntity).pop();
    parentEntity[nestedKey] = text.trim();
  }
});

parser.on("closetag", function (tag) {
  // End of entity
  if (tag === "ABR") {
    // If there are nested entities, restore the previous entity from the stack
    if (entityStack.length > 1) {
      let parentEntity = entityStack.pop();
      let nestedKey = Object.keys(parentEntity).pop();
      let nestedEntity = parentEntity[nestedKey];
      parentEntity[nestedKey] = [nestedEntity];
      currentEntity = parentEntity;
    }
    entities.push({ ...currentEntity });
  }
});

// Parse XML file
const xmlFilePath = "seed-data.xml";
const xmlStream = fs.createReadStream(xmlFilePath, { encoding: "utf8" });
xmlStream.pipe(parser);
xmlStream.on("end", async function () {
  // Insert data into MongoDB
  console.log(entities);
  try {
      // Insert data into MongoDB using Mongoose
      const insertedEntities = await EntityModel.insertMany(entities);
      console.log('Data inserted into MongoDB:', insertedEntities.length, 'documents');
  } catch (error) {
      console.error('Error inserting data into MongoDB:', error);
  } finally {
      // Close Mongoose connection
      mongoose.connection.close();
  }
});
