# Oracle Database

A Model Context Protocol server that provides read-only access to Oracle Database. This server enables LLMs to inspect database schemas, execute and explain read-only queries.

## Components

### Tools

- **query**
  - Execute read-only SQL queries against the connected Oracle Database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

- **explain**
  - Explain plan SQL queries against the connected Oracle Database
  - Input: `sql` (string): The SQL query to execute
  - Requires GRANT SELECT_CATALOG_ROLE TO your_user;

- **stats**
  - Get statistics for a given table on current connected schema
  - Input: `name` (string): The table name
  - Table owner is equal to USER SQL function returning value

- **connect**
  - Reconnect using new credentials
  - Input: `connectionString` (string): SQLNet connect string for example host.docker.internal:1521/freepdb1
  - Input: `user` (string): Username for example scott
  - Input: `password` (string): Password, for example tiger

- **awr**
  - Automatic Workload Repository (AWR) with optional sql_id, requires SELECT_CATALOG_ROLE and grant execute on DBMS_WORKLOAD_REPOSITORY package
  - Input: `sql_id` (string): (optional) SQL id to get the AWR report for an specific query, if null full last generated AWR report

### Resources

The server provides schema information for each table in the Oracle Database current connected user:

- **Table Schemas** (`oracle://USER/<table>/schema`)
  - JSON schema information for each table
  - Includes column names and data types
  - Automatically discovered from Oracle Database metadata

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

### Docker

* when running docker on macOS, use host.docker.internal if the server is running on the host network (eg localhost)
* username/password must be passed as environment variables

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
        "@marcelo-ochoa/server-oracle",
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

Sample prompts using the Oracle Database sample HR schema and 
[Oracle Database 23ai Free embedded database - Faststart - Docker Desktop Extension](https://open.docker.com/extensions/marketplace?extensionId=mochoa/oraclefree-docker-extension) .

- query SELECT COUNTRY_NAME, CITY, COUNT(DEPARTMENT_ID)
FROM COUNTRIES JOIN LOCATIONS USING (COUNTRY_ID) JOIN DEPARTMENTS USING (LOCATION_ID)
WHERE DEPARTMENT_ID IN
  (SELECT DEPARTMENT_ID FROM EMPLOYEES
   GROUP BY DEPARTMENT_ID
   HAVING COUNT(DEPARTMENT_ID)>5)
GROUP BY COUNTRY_NAME, CITY
- explain the execution plan
- visualize above execution plan in text mode
- get stats of COUNTRIES, LOCATIONS and DEPARTMENTS
- based on above table and index stats rewrite above query with a better execution plan
- visualize original and rewritten execution plan

See in action using Claude Desktop App

![Oracle MCP Server demo](https://github.com/marcelo-ochoa/servers/blob/main/src/oracle/demo-prompts.gif?raw=true)

### Using Docker AI

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
