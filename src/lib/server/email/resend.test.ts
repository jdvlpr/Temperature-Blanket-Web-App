import { describe, expect, it, vi } from 'vitest';
import { emailConfigProblem, getEmailSender } from '.';
import { ResendSender } from './resend';

describe('emailConfigProblem', () => {
  it('needs a known sender', () => {
    expect(emailConfigProblem(undefined)).toMatch(/EMAIL_SENDER/);
    expect(emailConfigProblem({ EMAIL_SENDER: 'smtp' })).toMatch(
      /EMAIL_SENDER/,
    );
  });

  it('needs Resend’s key and from-address', () => {
    expect(emailConfigProblem({ EMAIL_SENDER: 'resend' })).toMatch(
      /RESEND_API_KEY/,
    );
    expect(
      emailConfigProblem({ EMAIL_SENDER: 'resend', RESEND_API_KEY: 'k' }),
    ).toMatch(/EMAIL_FROM/);
    expect(
      emailConfigProblem({
        EMAIL_SENDER: 'resend',
        RESEND_API_KEY: 'k',
        EMAIL_FROM: 'a@example.test',
      }),
    ).toBeNull();
  });

  it('allows the dev outbox only where dev routes are on', () => {
    const bucket = {} as never;
    expect(
      emailConfigProblem({ EMAIL_SENDER: 'dev-outbox', PROJECTS: bucket }),
    ).toMatch(/ENABLE_DEV_ROUTES/);
    expect(
      emailConfigProblem({
        EMAIL_SENDER: 'dev-outbox',
        ENABLE_DEV_ROUTES: 'true',
        PROJECTS: bucket,
      }),
    ).toBeNull();
  });

  it('getEmailSender picks Resend when configured', () => {
    const sender = getEmailSender({
      env: {
        EMAIL_SENDER: 'resend',
        RESEND_API_KEY: 'k',
        EMAIL_FROM: 'a@example.test',
      },
    } as App.Platform);
    expect(sender).toBeInstanceOf(ResendSender);
  });
});

describe('ResendSender', () => {
  it('posts the message to Resend', async () => {
    const fetchFn = vi.fn(async () => new Response('{"id":"1"}'));
    await new ResendSender('re_key', 'TB <from@example.test>', fetchFn).send({
      to: 'a@example.test',
      subject: 'Hi',
      text: 'Body',
    });
    expect(fetchFn).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TB <from@example.test>',
        to: ['a@example.test'],
        subject: 'Hi',
        text: 'Body',
      }),
    });
  });

  it('throws when Resend refuses, so the failure is logged', async () => {
    const fetchFn = vi.fn(
      async () => new Response('{"message":"bad key"}', { status: 401 }),
    );
    await expect(
      new ResendSender('bad', 'a@example.test', fetchFn).send({
        to: 'b@example.test',
        subject: 'Hi',
        text: 'Body',
      }),
    ).rejects.toThrow(/401/);
  });
});
