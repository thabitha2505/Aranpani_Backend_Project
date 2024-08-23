const { EntitySchema, JoinColumn } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Profile',
    tableName: 'profile',
    columns: {
        profile_id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        name: {
            type: 'varchar',
        },
        country:{
            type: 'varchar'
        },
        state:{
            type: 'varchar'
        },
        district:{
            type: 'varchar'
        },
        address:{
            type: 'varchar'
        },
        pinCode: {
            type: 'numeric',
        },
        father_name: {
            type: 'varchar'
        },
        email: {
            type: 'varchar',
            unique: true,
        },
        donor_id: {
            type: 'integer',
            unique:true,
            
        },
        profilePicture :{
            type: 'varchar',
            nullable: true,
        }
        
    },
    relations: {
        donor_profile: {
            target: "User", 
            type: "many-to-one", 
            JoinColumn: {name: "donor_id"},
            onDelete: "CASCADE"
        }
    }
});

