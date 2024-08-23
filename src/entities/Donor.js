const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'user',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        name: {
            type: 'varchar',
        },
        role: {
            type: 'enum',
            enum: ['superadmin', 'admin', 'donor', 'area_rep']
        },
        address: {
            type: 'varchar',
        },
        pinCode: {
            type: 'numeric',
        },
        mobile_no: {
            type: 'varchar',
            unique: true,
            nullable:true
        },
        email: {
            type: 'varchar',
            unique: true,
        },
        password: {
            type: 'varchar',
        },
        language: {
            type: 'enum',
            enum: ['english', 'tamil'],
            default: 'english',
        },
        created_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        },
        updated_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
        },
        passwordResetToken: {
            type: 'varchar',
            default: '',
        },
        passwordResetTokenExpires: {
            type: 'date',
            nullable: true,
        }
    },
    relations: {
        areaReps: {
            target: 'AreaRep',
            type: 'many-to-one',
            inverseSide: 'donor',
            //joinColumn: { name: 'id', referencedColumnName: 'reg_no' }
        },
        profile: {
            target: 'Profile',
            type: 'one-to-many',
            inverseSide: 'donor_profile'
        },
        favourite: {
            target: 'Project',
            type: 'many-to-many',
            joinTable: {
                name: 'user_favourites',
                joinColumn: { name: 'user_id', referencedColumnName: 'id' },
                inverseJoinColumn: { name: 'project_id', referencedColumnName: 'id' }
            }
        }, 
        subscribe: {
            target: 'Project',
            type: 'many-to-many',
            joinTable: {
                name: 'user_subscribe',
                joinColumn: { name: 'user_id', referencedColumnName: 'id' },
                inverseJoinColumn: { name: 'project_id', referencedColumnName: 'id' }
            }
        },
        payment:{
            target:"Payment",
            type:"one-to-many",
            inverseSide:"donorPayment"
        },
        notifyDonor:{
            target:"Notification",
            type:"one-to-many",
            inverseSide:"donorNotification"
        },

    }
});
