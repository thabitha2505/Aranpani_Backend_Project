const { type } = require('os');
const {EntitySchema} = require('typeorm');

module.exports = new EntitySchema({
    name: 'Payment',
    tableName: 'payment',
    columns: {
        id:{
            type: 'integer',
            primary: true,
            generated: true
        },
        trans_amt:{
            type:'decimal'
        },
        donor_id:{
            type:'integer',
        },
        scheme:{
            type:"enum",
            enum:['monthly', 'half_yearly', 'annual'],
            nullable:false,
        },
        payment_link_enabled:{
            type:"boolean",
            default:false
        },
        paid_amt:{
            type:"decimal",
            nullable:true
        },
        trans_status:{
            type:'enum',
            enum:['pending','completed','failed'],
            default:'pending'
        },
        project_id:{
            type:"integer"
        },
        payment_date:{
            type:"date",
        },
        payment_method:{
            type:'enum',
            enum:['Google Pay UPI','Paytm UPI','PhonePe UPI','Amazon UPI'],
            nullable:false,
        },
        stripe_payment_intent_id:{
            type:'varchar',
            nullable:true
        },
        created_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        }
    },
    relations:{
        donorPayment:{
            target:'User',
            type:'many-to-one',
            onDelete:"CASCADE",
            nullable:true,
            joinColumn: {
                name: 'donor_id', // Used the donor_id as the foreign key
                referencedColumnName: 'id' // Reference the id column in the User entity
            }
        },
        projectPayment:{
            target:'Project',
            type:'many-to-one',
            onDelete:"CASCADE",
            nullable:true,
            joinColumn: {
                name: 'project_id', // Used the donor_id as the foreign key
                referencedColumnName: 'id' // Reference the id column in the User entity
            }
        }
    
    }
})

