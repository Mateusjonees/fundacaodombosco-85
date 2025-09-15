-- Remove redundant policy that allows all users to access clients table
DROP POLICY IF EXISTS "All authenticated users can access clients table structure" ON clients;

-- The main policy should be sufficient for access control