const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Project',
    tableName: 'project',
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true
        },
        temple_name: {
            type: 'varchar'
        },
        temple_addr: {
            type: 'varchar'
        },
        google_map_url: {
            type: 'varchar'
        },
        start_date: {
            type: 'date'
        },
        end_date: {
            type: 'date'
        },
        person_in_charge: {
            type: 'varchar'
        },
        expensed_amt: {
            type: 'decimal',
            default: 0
        }, 
        estimated_amt: {
            type: 'decimal',
            default: 0
        },
        status: {
            type: 'enum',
            enum: ['proposed', 'active', 'planned', 'completed', 'scrapped'],
            default: 'proposed'
        },
        contact_details: {
            type: 'varchar'
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
        photos: {
            type: 'jsonb'
        },
        documents: {
            type: 'jsonb'
        },
        activity_date: {
            type: 'date'
        },
        activity_desc: {
            type: 'text'
        }
    },
    relations: {
        favouriteBy: {
            target: 'User',
            type: 'many-to-many',
            onDelete: "CASCADE",
            nullable: true,
            joinTable: {
                name: 'user_favourites',
                joinColumn: { name: 'project_id', referencedColumnName: 'id' },
                inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
            },
            inverseSide: 'favourite'
        },
        subscribeBy: {
            target: 'User',
            type: 'many-to-many',
            onDelete: "CASCADE",
            nullable: true,
            joinTable: {
                name: 'user_subscribe',
                joinColumn: { name: 'project_id', referencedColumnName: 'id' },
                inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
            },
            inverseSide: 'subscribe'
        },
        paymentByDonorForSelectedProject:{
            target:"Payment",
            type:"one-to-many",
            inverseSide:"projectPayment"
        },
    }
});
