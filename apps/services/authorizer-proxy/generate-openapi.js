#!/usr/bin/env node

/**
 * Script to generate OpenAPI specification from the running server
 * Usage: node generate-openapi.js
 */

const fs = require('fs');
const path = require('path');

async function generateOpenAPISpec() {
  try {
    console.log('Fetching OpenAPI specification from http://localhost:3001/documentation/json ...');

    const response = await fetch('http://localhost:3001/documentation/json');

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
    }

    const spec = await response.json();

    // Write to file
    const outputPath = path.join(__dirname, 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

    console.log(`✓ OpenAPI specification saved to: ${outputPath}`);

    // Also save a YAML version if js-yaml is available
    try {
      const yaml = require('js-yaml');
      const yamlStr = yaml.dump(spec);
      const yamlPath = path.join(__dirname, 'openapi.yaml');
      fs.writeFileSync(yamlPath, yamlStr);
      console.log(`✓ OpenAPI specification (YAML) saved to: ${yamlPath}`);
    } catch (e) {
      console.log('Note: Install js-yaml to generate YAML version: pnpm add -D js-yaml');
    }

  } catch (error) {
    console.error('Error generating OpenAPI spec:', error.message);
    console.log('\nMake sure the authorizer-proxy server is running:');
    console.log('  pnpm nx serve authorizer-proxy');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateOpenAPISpec();
}