# Program

    POC API

## Configuration

    * cp .env.example .env
    * npm install
    * development (npm run dev)
    * production (npm run build => npm run start)

## Migration and Seeder
    
    * setup db config/config.json
    * run migration:
        - npm run db:migrate (to create all tables)
        - npm run db:migrate-undo (to drop all tables)
    * run seeder:
        - npm run db:seed (to insert data)
        - npm run db:seed-undo (to drop data)

## Endpoint

    * documentation.json
