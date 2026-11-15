UPDATE users AS u
SET company_id = grants.company_id
FROM (
  SELECT user_id, (array_agg(company_id))[1] AS company_id
  FROM radar_company_access
  GROUP BY user_id
  HAVING count(*) = 1
) AS grants
WHERE u.id = grants.user_id AND u.company_id IS NULL;
