import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_PROFILE_LABELS } from "../constants/company-profile.labels";
import type { CompanyProfileDetailsProps } from "../types/company-profile-details-props.types";
import { CompanyAboutSection } from "./company-about-section";
import { CompanyWebsiteSection } from "./company-website-section";

export function CompanyProfileDetails({ profile }: CompanyProfileDetailsProps) {
  const contactItems = [
    { icon: MapPin, label: COMPANY_PROFILE_LABELS.cityLabel, value: profile.city },
    { icon: Phone, label: COMPANY_PROFILE_LABELS.phoneLabel, value: profile.phone },
    { icon: Mail, label: COMPANY_PROFILE_LABELS.emailLabel, value: profile.email },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-16 rounded-lg after:rounded-lg">
            {profile.logoUrl ? (
              <AvatarImage
                src={profile.logoUrl}
                alt={COMPANY_PROFILE_LABELS.logoAlt}
                className="rounded-lg object-contain"
              />
            ) : null}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-7" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold wrap-anywhere text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.sector ?? COMPANY_PROFILE_LABELS.emptyValue}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <CompanyAboutSection description={profile.description} />
          <CompanyWebsiteSection website={profile.website} />
        </div>

        <Card aria-label={COMPANY_PROFILE_LABELS.contactTitle} role="region">
          <CardHeader>
            <CardTitle>{COMPANY_PROFILE_LABELS.contactTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {contactItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-medium text-foreground">{label}</dt>
                    <dd className="wrap-anywhere text-muted-foreground">{value ?? COMPANY_PROFILE_LABELS.emptyValue}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
