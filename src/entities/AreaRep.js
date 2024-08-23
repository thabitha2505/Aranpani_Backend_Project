const { type } = require("os");
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "AreaRep",
    tableName: "area_rep",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true
        },
        reg_no: {
            type: "varchar",
            unique: true
        },
        name:{
            type: "varchar",
        },
        donor_id: {
            type: "int",
            nullable:true
        },
        pinCode: {
            type: "varchar"
        },
        location: {
            type: "varchar",
            length: 400
        },
        mobile_no: {
            type: "varchar",
            unique: true
        }
    }, 
    relations: {
        donor: {
            target: "User",
            type: "one-to-many",
            inverseSide: "areaReps",
            onDelete: "CASCADE",
                joinColumn: {
                    name: 'donor_id', // Used the donor_id as the foreign key
                    referencedColumnName: 'id' // Reference the id column in the User entity
                }
        },
    
    }
});
