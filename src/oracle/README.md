# Oracle

A Model Context Protocol server that provides read-only access to Oracle databases. This server enables LLMs to inspect database schemas, execute and explain read-only queries.

## Components

### Tools

- **query**
  - Execute read-only SQL queries against the connected database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

- **explain**
  - Explain plan SQL queries against the connected database
  - Input: `sql` (string): The SQL query to execute
  - Requires GRANT SELECT_CATALOG_ROLE TO your_user;

- **stats**
  - Get statistics for a given table on current connected schema
  - Input: `name` (string): The table name
  - Table owner is equal to USER SQL function returning value

### Resources

The server provides schema information for each table in the database current connected user:

- **Table Schemas** (`oracle://USER/<table>/schema`)
  - JSON schema information for each table
  - Includes column names and data types
  - Automatically discovered from database metadata using dbms_developer package (23c)

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

### Docker

* when running docker on MacOS, use host.docker.internal if the server is running on the host network (eg localhost)
* username/password must be passed as environment variable

```json
{
  "mcpServers": {
    "oracle": {
      "command": "docker",
      "args": [
        "run", 
        "-i", 
        "--rm", 
        "-e",
        "ORACLE_USER=scott",
        "-e",
        "ORACLE_PASSWORD=tiger",
        "mochoa/mcp-oracle", 
        "host.docker.internal:1521/freepdb1"]
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "oracle": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-oracle",
        "localhost:1521/freepdb1"
      ],
      "env": {
        "ORACLE_USER": "scott",
        "ORACLE_PASSWORD": "tiger"
      }
    }
  }
}
```

Replace `/freepdb1` with your database name.

### Demo Prompts

Sample prompts using Oracle HR schema and 
[OracleFree 23c embedded RDBMS - Faststart - Docker Desktop Extension](https://open.docker.com/extensions/marketplace?extensionId=mochoa/oraclefree-docker-extension) .

- query SELECT COUNTRY_NAME, CITY, COUNT(DEPARTMENT_ID)
FROM COUNTRIES JOIN LOCATIONS USING (COUNTRY_ID) JOIN DEPARTMENTS USING (LOCATION_ID) 
WHERE DEPARTMENT_ID IN 
    (SELECT DEPARTMENT_ID FROM EMPLOYEES 
   GROUP BY DEPARTMENT_ID 
   HAVING COUNT(DEPARTMENT_ID)>5)
GROUP BY COUNTRY_NAME, CITY
- explain the execution plan
- visualize above execution plan

Here's a visualization of the execution plan:

```ascii
SELECT STATEMENT (0)
└── HASH GROUP BY (1)
    └── NESTED LOOPS (2)
        └── NESTED LOOPS (3)
            ├── VIEW VW_GBF_17 (4)
            │   └── HASH GROUP BY (5)
            │       └── FILTER (6)
            │           ├── TABLE ACCESS FULL DEPARTMENTS (7)
            │           └── FILTER (8)
            │               └── HASH GROUP BY (9)
            │                   └── TABLE ACCESS FULL EMPLOYEES (10)
            ├── TABLE ACCESS BY INDEX ROWID LOCATIONS (11)
            │   └── INDEX UNIQUE SCAN LOC_ID_PK (12)
            └── INDEX UNIQUE SCAN COUNTRY_C_ID_PK (13)
```

The numbers in parentheses correspond to the operation IDs in the plan. The execution flows from bottom to top and right to left:

1. Scans employees table to find departments with >5 employees
2. Filters departments based on those results
3. Uses index scans to efficiently join with locations and countries
4. Groups results by country and city with hash grouping

Key operations:
- Hash grouping for aggregation (ID: 1, 5, 9)
- Nested loop joins for efficient joining (ID: 2, 3)
- Index scans for fast lookups (ID: 12, 13)
- Full table scans where needed (ID: 7, 10)

- get stats of COUNTRIES, LOCATIONS and DEPARTMENTS
- based on above table and index stats rewrite above query with a better execution plan
- visualize original and rewritten execution plan

### Comparison of Original vs Optimized Query Execution Plans

Original Query Execution Plan:
```ascii
SELECT STATEMENT (0)
└── HASH GROUP BY (1)
    └── NESTED LOOPS (2)
        └── NESTED LOOPS (3)
            ├── VIEW VW_GBF_17 (4)
            │   └── HASH GROUP BY (5)
            │       └── FILTER (6)
            │           ├── TABLE ACCESS FULL DEPARTMENTS (7)
            │           └── FILTER (8)
            │               └── HASH GROUP BY (9)
            │                   └── TABLE ACCESS FULL EMPLOYEES (10)
            ├── TABLE ACCESS BY INDEX ROWID LOCATIONS (11)
            │   └── INDEX UNIQUE SCAN LOC_ID_PK (12)
            └── INDEX UNIQUE SCAN COUNTRY_C_ID_PK (13)
```

Optimized Query Execution Plan:
```ascii
SELECT STATEMENT (0)
└── HASH GROUP BY (1)
    └── FILTER (2)
        └── NESTED LOOPS (3)
            ├── HASH JOIN (4)
            │   ├── VIEW index$_join$_001 (5)
            │   │   └── HASH JOIN (6)
            │   │       ├── INDEX FAST FULL SCAN DEPT_ID_PK (7)
            │   │       └── INDEX FAST FULL SCAN DEPT_LOCATION_IX (8)
            │   └── TABLE ACCESS FULL LOCATIONS (9)
            ├── INDEX UNIQUE SCAN COUNTRY_C_ID_PK (10)
            └── FILTER (11)
                └── HASH GROUP BY (12)
                    └── TABLE ACCESS FULL EMPLOYEES (13)
```

Key Differences:
1. Join Strategy:
   - Original: Uses nested loops throughout
   - Optimized: Mix of hash joins and nested loops for better performance
   
2. Index Usage:
   - Original: Basic index scans
   - Optimized: Uses fast full index scans on department indexes
   
3. Subquery Handling:
   - Original: Uses materialized view (VW_GBF_17)
   - Optimized: Direct filter with exists clause
   
4. Join Order:
   - Original: Starts with departments/employees subquery
   - Optimized: Starts with departments (LEADING hint) for better join order

Both plans have similar overall cost (62) but the optimized version:
- Has better index utilization
- More efficient join strategies
- Improved subquery processing
- Better join order based on table statistics

See in action using Claude Desktop App

![Oracle MCP Server demo](./demo-prompts.gif)

## Using Docker AI

[Ask Gordon](https://docs.docker.com/desktop/features/gordon/) is an AI assistant designed to streamline your Docker workflow by providing contextual assistance tailored to your local environment. Currently in Beta and available in Docker Desktop version 4.38.0 or later, Ask Gordon offers intelligent support for various Docker-related tasks.

```sh
% cd src/oracle
% docker ai 'stats for table countries'    
                                                    
    • Calling stats ✔️                              
                                                    
  Here are the statistics for the COUNTRIES table:  
                                                    
  ### Table Statistics:                             
                                                    
    • Owner: HR                                     
    • Table Name: COUNTRIES                         
    • Number of Rows: 25                            
    • Average Row Length: 16 bytes                  
    • Last Analyzed: 2025-03-10 22:00:38            
                                                    
  ### Index Statistics:                             
                                                    
    • Index Name: COUNTRY_C_ID_PK                   
        • B-Level: 0                                
        • Leaf Blocks: 1                            
        • Distinct Keys: 25                         
        • Number of Rows: 25                        
        • Clustering Factor: 0                      
        • Last Analyzed: 2025-03-10 22:00:38        
                                                    
  ### Column Statistics:                            
                                                    
    1. COUNTRY_ID:                                  
                                                    
        • Number of Distinct Values: 25             
        • Density: 0.04                             
        • Histogram: NONE                           
        • Last Analyzed: 2025-03-10 22:00:38        
                                                    
    2. COUNTRY_NAME:                                
                                                    
        • Number of Distinct Values: 25             
        • Density: 0.04                             
        • Histogram: NONE                           
        • Last Analyzed: 2025-03-10 22:00:38        
                                                    
    3. REGION_ID:                                   
                                                    
        • Number of Distinct Values: 5              
        • Density: 0.02                             
        • Histogram: FREQUENCY                      
        • Last Analyzed: 2025-03-10 22:00:38        
```

Using this sample gordon-mcp.yml file in a current directory:

```yml
services:
  time:
    image: mcp/time
  oracle:
    image: mochoa/mcp-oracle
    command: ["host.docker.internal:1521/freepdb1"]
    environment:
      - ORACLE_USER=scott
      - ORACLE_PASSWORD=tiger
```

## Building

Docker:

```sh
docker build -t mochoa/mcp-oracle -f src/oracle/Dockerfile . 
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
