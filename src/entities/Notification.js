const {EntitySchema} = require('typeorm');

module.exports = new EntitySchema({
    name:"Notification",
    tableName:"notification",
    columns:{
        id:{
            type:"integer",
            primary:true,
            generated: true
        },
        user_id:{
            type:"integer",

        },
        message:{
            type:"varchar"
        },
        created_at: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP"
        }
    },
    relations:{
        donorNotification:{
            target:'User',
            type:'many-to-one',
            onDelete:"CASCADE",
            nullable:true,
            joinColumn: {
                name: 'user_id', // Used the user_id as the foreign key
                referencedColumnName: 'id' // Reference the id column in the User entity
            }
        }
    }
})