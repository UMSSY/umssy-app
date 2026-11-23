"use client";

import React, { useEffect, useState } from "react";
import { getCompanyProfile } from "../services/company-profile.service";
import type { CompanyProfile, ProfileLoadStatus } from "../types/company-profile.types";
import { CompanyProfileView } from "../views/company-profile-view";

export function CompanyProfileContainer() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [status, setStatus] = useState<ProfileLoadStatus>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    getCompanyProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setStatus("success");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const handleRetry = () => {
    setStatus("loading");
    setRetryCount((prev) => prev + 1);
  };

  return (
    <CompanyProfileView
      profile={profile}
      status={status}
      onRetry={handleRetry}
    />
  );
}