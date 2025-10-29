# Program

    Pesantren API

## Configuration

    * cp .env.example .env
    * npm install
    * development (npm run dev)
    * production (npm run build => npm run start)

## Migration and Seeder

    * migration:
        - npm run make:migration -- {name} (create file migration and change extention file .js to .ts)
        - npm run db:migrate (create all tables)
        - npm run db:migrate-undo (drop all tables)
    * seeder:
        - npm run make:seed -- {name} (create file seeder and change extention file .js to .ts)
        - npm run db:seed (insert data)
        - npm run db:seed-undo (drop data)

## Endpoint

    * documentation.json
