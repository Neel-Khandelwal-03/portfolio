import type { SVGProps } from "react";

/**
 * Inline icons.
 *
 * A dozen paths weigh a few hundred bytes; an icon package would add a
 * dependency and ship a component wrapper for every glyph. Each icon inherits
 * `currentColor` and is hidden from assistive technology — the surrounding
 * control always carries the accessible name.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.2c-3.34.72-4.04-1.42-4.04-1.42-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.33 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.02 4.13H5.05l12.03 15.64Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 7 8.2 5.6a1.5 1.5 0 0 0 1.6 0L21 7" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M3 12h18M12 2.75c2.4 2.6 3.6 5.7 3.6 9.25S14.4 18.65 12 21.25c-2.4-2.6-3.6-5.7-3.6-9.25S9.6 5.35 12 2.75Z" />
    </Icon>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5" />
    </Icon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 2.75H7A2.25 2.25 0 0 0 4.75 5v14A2.25 2.25 0 0 0 7 21.25h10A2.25 2.25 0 0 0 19.25 19V8l-5.25-5.25Z" />
      <path d="M13.75 3v5.25H19M8.5 13.5h7M8.5 17h5" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.75v11.5m0 0 4-4m-4 4-4-4M4.25 17.5v1.25a1.5 1.5 0 0 0 1.5 1.5h12.5a1.5 1.5 0 0 0 1.5-1.5V17.5" />
    </Icon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4.75h5.25V10M19 5l-8.5 8.5" />
      <path d="M18.25 14v4.75A1.5 1.5 0 0 1 16.75 20H5.25a1.5 1.5 0 0 1-1.5-1.5V7.25a1.5 1.5 0 0 1 1.5-1.5H10" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.75 12h14.5m0 0-5.5-5.5m5.5 5.5-5.5 5.5" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.25 12H4.75m0 0 5.5-5.5M4.75 12l5.5 5.5" />
    </Icon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 14.5 6-6 6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.5 6.5 11 11m0-11-11 11" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 14.3A8.75 8.75 0 0 1 9.7 3.5a8.75 8.75 0 1 0 10.8 10.8Z" />
    </Icon>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.75" y="4.25" width="18.5" height="12.5" rx="2" />
      <path d="M8.5 20.25h7M12 16.75v3.5" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7.5v5.25M12 16.25h.01" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.75 6.5h14.5M9.5 6.5V5a1.25 1.25 0 0 1 1.25-1.25h2.5A1.25 1.25 0 0 1 14.5 5v1.5" />
      <path d="M6.75 6.5 7.5 19a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l.75-12.5M10.5 10v6.5M13.5 10v6.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.5 3.75a2.12 2.12 0 0 1 3 3L8.5 17.75l-4 1 1-4L16.5 3.75Z" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 20.25H6a1.75 1.75 0 0 1-1.75-1.75V5.5A1.75 1.75 0 0 1 6 3.75h3.5M15.5 16l4.25-4-4.25-4M19.25 12H9.5" />
    </Icon>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2" />
      <path d="M3.75 9.75h16.5M8.5 3.75v3M15.5 3.75v3" />
    </Icon>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.25" y="7.25" width="17.5" height="13" rx="2" />
      <path d="M8.75 7.25V5.5A1.75 1.75 0 0 1 10.5 3.75h3a1.75 1.75 0 0 1 1.75 1.75v1.75M3.25 12.5h17.5" />
    </Icon>
  );
}

export function AcademicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 9.25 4.5L12 13 2.75 8.5 12 4Z" />
      <path d="M6.5 10.75V16c0 1.3 2.46 2.75 5.5 2.75s5.5-1.45 5.5-2.75v-5.25M20.5 9.25v5.5" />
    </Icon>
  );
}

export function CertificateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9.5" r="5.75" />
      <path d="m8.5 14.5-1 6.75L12 19l4.5 2.25-1-6.75" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 4.25h9v5a4.5 4.5 0 0 1-9 0v-5Z" />
      <path d="M7.5 6H5.25a2 2 0 0 0 0 4H7M16.5 6h2.25a2 2 0 0 1 0 4H17M9.5 20.25h5M12 13.75v6.5" />
    </Icon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5Z" />
    </Icon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 16.5V4.75m0 0-4 4m4-4 4 4M4.25 17.5v1.25a1.5 1.5 0 0 0 1.5 1.5h12.5a1.5 1.5 0 0 0 1.5-1.5V17.5" />
    </Icon>
  );
}

export function SpinnerIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Maps a `social_links.platform` value to its icon. */
export const SOCIAL_ICONS = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  email: MailIcon,
  x: XIcon,
  leetcode: CodeIcon,
  kaggle: SparkIcon,
  website: GlobeIcon,
} as const;

export type SocialPlatform = keyof typeof SOCIAL_ICONS;

export function socialIconFor(platform: string) {
  return SOCIAL_ICONS[platform as SocialPlatform] ?? GlobeIcon;
}

/**
 * Renders the icon for a social platform.
 *
 * Callers use `<SocialIcon platform={...} />` rather than assigning
 * `socialIconFor(...)` to a local component variable, which the React compiler
 * flags as creating a component during render.
 */
export function SocialIcon({
  platform,
  ...props
}: IconProps & { platform: string }) {
  const Component = SOCIAL_ICONS[platform as SocialPlatform] ?? GlobeIcon;
  return <Component {...props} />;
}
