
import axios from 'axios';

const PROXY_URL = 'http://localhost:3001'; // Targeting Proxy directly to ensure headers are passed
const DATA_API_URL = 'http://localhost:7001'; // For reference

// Helper to Delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runTests() {
    console.log('Starting Access Control Verification...');

    // 1. Test Dam Operator - Create - Within Working Hours
    console.log('\n--- Test 1: Dam Operator Create (Valid Hours) ---');
    try {
        const currentHour = new Date().getUTCHours();
        console.log(`DEBUG: UTC Hour: ${currentHour}, Local Hour: ${new Date().getHours()}`);
        const headers = {
            'x-test-user': JSON.stringify({
                id: 'dam-op-1',
                username: 'dam_op_1',
                roles: ['dam_operator'],
                offices: ['SWT'],
                persona: 'dam_operator',
                shift_start: Math.max(0, currentHour - 1),
                shift_end: Math.min(23, currentHour + 2),
                timezone: 'UTC' // Assuming server uses UTC or local matches
            })
        };

        // We try to create a dummy timeseries (or just check if request passes auth)
        // Using a simple GET first to check Read access is allowed
        // POST might require valid body. OPA checks 'action' and 'resource'.
        // Let's try to access a protected resource.

        // Actually, to test 'Create' we need to send POST.
        // If we send invalid body, API returns 400. Proxy returns 403 if Auth fails.
        // So 400 means Auth passed!

        const response = await axios.post(`${PROXY_URL}/cwms-data/timeseries?office_id=SWT&data_source=MANUAL`, {}, {
            headers: headers,
            validateStatus: (status) => status < 500 // Accept anything not 500
        });

        if (response.status === 403) {
            console.error('FAIL: Denied Valid Dam Operator Create');
        } else {
            console.log(`SUCCESS: Passed Auth (Status: ${response.status})`);
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    }

    // 2. Test Dam Operator - Create - Outside Working Hours
    console.log('\n--- Test 2: Dam Operator Create (Invalid Hours) ---');
    try {
        const currentHour = new Date().getUTCHours();
        // Shift is in the past
        const headers = {
            'x-test-user': JSON.stringify({
                id: 'dam-op-2',
                username: 'dam_op_2',
                roles: ['dam_operator'],
                offices: ['SWT'],
                persona: 'dam_operator',
                shift_start: Math.max(0, currentHour - 5),
                shift_end: Math.max(0, currentHour - 2),
                timezone: 'UTC'
            })
        };

        const response = await axios.post(`${PROXY_URL}/cwms-data/timeseries?office_id=SWT&data_source=MANUAL`, {}, {
            headers: headers,
            validateStatus: (status) => status < 500
        });

        if (response.status === 403) {
            console.log(`SUCCESS: Denied as expected (Status: ${response.status})`);
        } else {
            console.error(`FAIL: Allowed Invalid Dam Operator Create (Status: ${response.status})`);
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    }

    // 3. Test Dam Operator - Update - Modification Window
    console.log('\n--- Test 3: Dam Operator Update (Modification Window) ---');
    try {
        // Trying to PATCH/UPDATE.
        // We assume OPA needs to check 'created_ns'.
        // If the resource doesn't exist or isn't fetched, OPA might not get 'created_ns'.
        // We suspect this might fail or error if logic isn't fully implemented in Proxy to fetch resource meta.

        const currentHour = new Date().getUTCHours();
        const headers = {
            'x-test-user': JSON.stringify({
                id: 'dam-op-1',
                username: 'dam_op_1',
                roles: ['dam_operator'],
                offices: ['SWT'],
                persona: 'dam_operator',
                shift_start: Math.max(0, currentHour - 1),
                shift_end: Math.min(23, currentHour + 2),
                timezone: 'UTC'
            })
        };

        // Using a fake ID. The API would return 404 if Auth passes.
        // Proxy returns 403 if Auth fails.
        const response = await axios.patch(`${PROXY_URL}/cwms-data/timeseries/test-ts-id?office_id=SWT&data_source=MANUAL`, {}, {
            headers: headers,
            validateStatus: (status) => status < 500
        });

        if (response.status === 403) {
            console.warn(`POTENTIAL ISSUE: Denied Update (Status: ${response.status}). Expected to pass Auth if simple logic, or might be failing due to missing created_ns context.`);
            // If OPA policy says: time_rules.within_modification_window(input.context, input.user)
            // And input.context.created_ns is missing, the rule 'time.now_ns() - resource.created_ns < ...' might fail or be undefined.
            // If undefined, 'allow' is false (default).
        } else {
            console.log(`SUCCESS? Passed Auth (Status: ${response.status}). Validation might be incomplete if it didn't check Modification Window.`);
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    }

    // 4. Test Embargo - Read
    console.log('\n--- Test 4: Embargo (Read Headers) ---');
    try {
        // User with Embargo
        const headers = {
            'x-test-user': JSON.stringify({
                id: 'gen-user',
                username: 'gen_user',
                roles: [],
                offices: ['SWT'],
                persona: 'general_user'
            })
        };

        // GET Request
        // We can't easily see downstream headers from outside.
        // But we know 'AuthorizationFilterHelper.java' logs the context.
        // We can check if the Request is Allowed (200 OK) but filtered?
        // The Proxy should ADD headers, not Block (unless OPA denies entirely).
        // OPA 'data_under_embargo' rule is NOT in the main 'allow' block of 'cwms_authz.rego' shown earlier?
        // Wait, let's re-read cwms_authz.rego.
        // 'allow' rules usually reference personas.
        // public.allow, dam_operator.allow...
        // Embargo logic is usually a Filter Constraint passed to Java, NOT an OPA Deny (unless implemented as deny).
        // The 'data_under_embargo' rule was in 'time_rules.rego'.
        // Is it used in 'cwms_authz' allow?
        // No, it seemed unused in the main allow block shown.
        // It is likely used to generate the 'constraints' object in OPA response.

        // So we expect 200 OK, but with 'x-cwms-auth-context' header sent to API.
        // We can't verifying the header exists unless we inspect logs or use keycloak-cda flow?
        // For now we assume if it returns 200, it's "working" in terms of access, 
        // and we'll check logs for the applied filter.

        const response = await axios.get(`${PROXY_URL}/cwms-data/offices`, { // Simple read
            headers: headers,
            validateStatus: (status) => status < 500
        });

        console.log(`Embargo User Read Status: ${response.status}`);

    } catch (error: any) {
        console.error('ERROR:', error.message);
    }
}

runTests();
