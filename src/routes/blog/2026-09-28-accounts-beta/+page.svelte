<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import { ArrowLeftIcon } from '@lucide/svelte';

  const title = 'Accounts (Beta): Your Projects on Every Device';
  const description =
    'Sign in to save your temperature blanket projects to an account, open them on any device, and have changes save automatically. Accounts are optional and in beta.';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/2026-09-28-accounts-beta"
  />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Accounts (Beta)">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn hover:preset-tonal-surface mb-2 max-lg:mx-2 max-lg:mt-2"
        ><ArrowLeftIcon /> Blog</a
      >
      <Card>
        {#snippet header()}
          <div>
            <img
              src="/images/blog-images/2026-09-28-accounts-beta/featured-image.svg"
              class="h-36 w-full object-cover object-center"
              alt="Temperature blanket stripes with a cloud and a check mark"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="mb-8 flex flex-col gap-4 px-2 pb-4">
            <div class="mt-4 flex flex-col gap-2">
              <h2 class="h2 text-gradient">{title}</h2>
              <p class="text-sm">September 28, 2026</p>
            </div>

            <p>
              Hello! This is Thomas, the developer of temperature-blanket.com.
              One of the most requested features has been a way to get to your
              projects from more than one device, like starting a plan on your
              computer and checking your colors on your phone while you crochet
              or knit. Today I'm opening a beta of accounts, which does just
              that.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">What's new?</p>

            <p class="font-bold">Sign in, no password needed</p>
            <p>
              Press the person icon in the top right corner to sign in. You can
              sign in with your email address, and I'll email you a 6-digit code
              to enter. There's no password to make up or remember. You can also
              sign in with Google.
            </p>

            <p class="font-bold">Your projects on every device</p>
            <p>
              When you're signed in, projects you save are kept in your account.
              Sign in on another computer, phone or tablet and they're there.
              Syncing happens by itself in the background. You can see when your
              projects last synced by pressing your picture or initial in the
              top bar.
            </p>

            <p class="font-bold">Changes save automatically</p>
            <p>
              Save a new project once, using <span class="italic">Save</span> in
              the <span class="italic">Project</span> menu. After that, any
              changes you make save on their own a moment after you stop
              editing. The <span class="italic">Project</span> menu shows whether
              the latest change is saved. New projects don't save until you save them
              yourself, so trying out ideas won't fill up your account.
            </p>
            <p>
              If you'd like to try something different without changing the
              original, use <span class="italic">Save a copy</span> in the
              <span class="italic">Project</span> menu. You'll keep working on the
              copy, and the original stays as it was.
            </p>

            <p class="font-bold">Projects you've already saved</p>
            <p>
              Projects saved in your browser before you signed in stay there.
              When you first sign in, you'll be asked whether to add them to
              your account. You can also add them later from your
              <a href="/account" class="link">Account</a> page.
            </p>

            <p class="font-bold">Editing on two devices at once</p>
            <p>
              If a project is changed on another device while you have it open,
              the app won't overwrite those changes. Instead, you can save your
              version as a copy, or reload to get the latest version.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">Accounts are optional</p>
            <p>
              You don't need an account to use the Project Planner or anything
              else on the site. Without one, everything works as it always has:
              projects save in your browser, and you can share or bookmark a
              project's link.
            </p>

            <p class="font-bold">Signing out</p>
            <p>
              When you sign out, you can choose to keep your projects in that
              browser or remove them, which is handy on a shared computer.
              Either way, they stay in your account for next time.
            </p>

            <p class="font-bold">Your data</p>
            <p>
              From your <a href="/account" class="link">Account</a> page you can
              change your name or email, download everything in your account, or
              delete your account and its projects. An account can hold up to
              200 projects. The
              <a href="/privacy" class="link">Privacy Policy</a> explains what's stored
              and why. In short, it's what's needed to sign you in and keep your projects,
              and nothing is sold or used for ads.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">About the beta</p>
            <p>
              Accounts will be in beta for the next few weeks while I make sure
              everything works well. During the beta, things may change a bit
              and there may be the occasional bug. Your projects are also kept
              in your browser, so they stay safe even if syncing has a hiccup.
            </p>

            <h2 class="text-2xl font-bold">Feedback</h2>
            <p>
              This is a big update, and I'd love to hear how it works for you.
              If you have feedback of any kind, or run into any issues, please
              let me know through any of the methods listed on the
              <a href="/contact" class="link">contact page</a>. Thank you!
            </p>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
