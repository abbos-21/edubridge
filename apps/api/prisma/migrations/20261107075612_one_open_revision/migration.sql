-- At most one open (draft / in review / rejected) revision per catalogue record.
CREATE UNIQUE INDEX "CatalogueRevision_one_open_per_entity"
  ON "CatalogueRevision" ("entityType", "entityId")
  WHERE "status" IN ('draft', 'in_review', 'rejected');
