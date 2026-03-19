- Automate Your AI Workflows with Claude Code Hooks | Butler's Log
7 months ago by [Scott Chacon](/author/schacon)

10 min read[engineering](/tag/engineering)
# Automate Your AI Workflows with Claude Code Hooks
Claude Code's new hooks system is a powerful tool for automating your agent workflows. We'll do a quick overview of what's possible and explore a few fun examples.
![Automate Your AI Workflows with Claude Code Hooks](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-automate-with-claude.jpg&w=3840&q=75)[
](https://news.ycombinator.com/submitlink?u=https%3A%2F%2Fblog.gitbutler.com%2Fautomate-your-ai-workflows-with-claude-code-hooks&t=Automate%20Your%20AI%20Workflows%20with%20Claude%20Code%20Hooks)[](https://bsky.app/intent/compose?text=Automate%20Your%20AI%20Workflows%20with%20Claude%20Code%20Hooks%20https%3A%2F%2Fblog.gitbutler.com%2Fautomate-your-ai-workflows-with-claude-code-hooks)[](https://twitter.com/intent/tweet?text=Automate%20Your%20AI%20Workflows%20with%20Claude%20Code%20Hooks&url=https%3A%2F%2Fblog.gitbutler.com%2Fautomate-your-ai-workflows-with-claude-code-hooks)A while ago we realized that a lot of our users were taking advantage of our rather unique [virtual branches](https://docs.gitbutler.com/features/virtual-branches/virtual-branches) functionality in GitButler to manage the code that their coding agents were producing into multiple branches easily, so we started to work on better ways to interact with them.

What we really wanted to do was inspect what an agent was doing so we could automatically create save points that could easily be edited. Or even better, know what topic the agent was working on so we could try to group the changes into multiple branches.

However, most agents are almost entirely opaque - you can't see anything that Cursor or Windsurf is doing, for example other than the files that they're editing on disk.

## Claude Code Hooks

However, recently Anthropic shipped [lifecycle hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) for their terminal based coding agent. These provide the ability to tell Claude to run a script whenever one of it's sessions reaches any of these points:

[Prompt submission](https://docs.anthropic.com/en/docs/claude-code/hooks#userpromptsubmit) (right before it starts working)

- [Right before it uses a "tool"](https://docs.anthropic.com/en/docs/claude-code/hooks#pretooluse)

(file edit, file read, shell command, file search, web search, etc)

- [Right after it uses said tool](https://docs.anthropic.com/en/docs/claude-code/hooks#posttooluse)

- [It needs information from you](https://docs.anthropic.com/en/docs/claude-code/hooks#notification) (permission for tool use for example)

- [Before it compacts it's context](https://docs.anthropic.com/en/docs/claude-code/hooks#precompact)

- [When it's done](https://docs.anthropic.com/en/docs/claude-code/hooks#stop)

That's a lot of stuff. Which is awesome, because it means that now you can script all sorts of automations and extra workflow additions and controls that you simply cannot do with other code generation agents.

Since we just shipped a way to use GitButler to [automatically commit work into one lane per session](/parallel-claude-code/) based on these hooks, and we learned a lot while implementing it, we thought we would show you how you can use this for fun and profit too.

So, here is a very simple tutorial on how you can add a pretty useful hook to your Claude Code workflow in a few minutes as an example of what this can do and how to set it up.

💡
Hooks are a very recent addition to Claude Code, released initially in June 2025. I'm on `1.0.59` and you can easily update by running `claude update`

## A simple example

We're going to add a simple hook that will make Claude send you a desktop notification when a session is completed.

Since we want to know when something is completed, we'll use the `Stop` hook, which fires when everything in a session is done.

You can set up a hook in one of three places:

- `~/.claude/settings.json` - User settings, runs on any of your projects.

- `.claude/settings.json` - Project settings, only runs on that project and should be committed (for the rest of your team)

- `.claude/settings.local.json` - Local project settings, meant to not be committed, just for you.

Claude Code should look for *all* of these files, and fire every hook that matches in any of them. Since what we're doing is pretty generic and also platform specific, we'll put it in the user settings (`~/.claude/settings.json`)

## How to do a Desktop notification on Mac

This should be simple, but it's sadly *slightly* complicated.

On a Mac, you can run `osascript` to do a notification, but the catch is that if you've never done this before, you need to open up a program called Script Editor, run it manually first, give it system permissions, then you're good going forward.

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-16.07.50%25402x.png&w=3840&q=75)

Find 'Script Editor' under Notifications in your Settings and allow
notifications

Once you have permissions, then you can just run something like this in your terminal to see a cool little notification and sound:

```
$ osascript -e 'display notification "Nailed it" with title "Claude Code" subtitle "AI assistant" sound name "Glass"

```

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-16.12.09%25402x.png&w=3840&q=75)

Nailed it.

Ok, now we can do a simple desktop notification. Let's make Claude nail it.

## Adding the hook

It's possible that you already have something in some of these files, sometimes Claude will add [permissions rules](https://docs.anthropic.com/en/docs/claude-code/settings#permission-settings) to your local project file, but you probably won't have a User settings file yet, or it may be empty.

So, go ahead and make your `~/.claude/settings.json` look something like this:

JSON
```
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude has finished!\" with title \"✅ Claude Done\" sound name \"Glass\"'"
          }
        ]
      }
    ]
  }
}

```

If we then run Claude anywhere, it will give us this little popup every time it's finished with a chat based task.

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-16.22.07%25402x.png&w=3840&q=75)

You can't hear it, but it also made a little ding sound.

## A massively complicated example

Ok, we have our cute example and you probably want to stop reading here. I'm sure you can take that, look at the hooks docs and figure out how to do all sorts of pretty cool things, like perhaps:

- Auto-formatting or linting after a file edit

- Sensitive command blocking, like blacklisting an `rm -rf`

- Access controls to restrict changes to critical files or directories

- Prompt validation to analyze or sanitize user prompts before processing

- Auto documentation, for example firing off a background process to re-document affected files

- Storing session transcripts to automatically keep all the transcripts of everything you've done in Claude somewhere

Whatever, the world is your Claude-based oyster.

I was just going to end here, but I figured it might be fun to really get into the weeds and even abuse Git a little along the way.

What I'll do now is implement a poor-man's version of what the GitButler client does with it's [Claude Code hooks integration](https://docs.gitbutler.com/features/ai-integration/claude-code-hooks), which is to create a new commit after every chat session is finished. To make the task much more complicated and abuse Git the way I promised, we'll even store changes from multiple simultaneous running sessions in different branches.

Let's do some fun Git magic.

## Version One: Auto Committing

Your should be able to figure out how to do this on a very basic level, since we already are running a command when a session finishes. It's fairly straightforward to change the notification into a `git commit -m checkpoint`. You can always clean up and edit the commits later, but it gives you rollback points to just about anywhere.

However, let's make it slightly better by using the *prompt itself* as the commit message.

This introduces a new concept to the hooks, which is [hook input](https://docs.anthropic.com/en/docs/claude-code/hooks#hook-input). Every hook gets called with json data passed to `stdin`, the format of which depends on the hook. In the case of the `Stop` hook, we get something like this:

JSON
```
{
  "session_id": "eb5b0174-0555-4601-804e-672d68069c89",
  "transcript_path": "/Users/schacon/.claude/projects/-Users-schacon-projects-testing/eb5b0174-0555-4601-804e-672d68069c89.jsonl",
  "cwd": "/Users/schacon/projects/testing",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}

```

So, you can see immediately some useful data:

- A session ID, so simultaneous instances of Claude Code can be differentiated.

- A working directory, so we know what project this is being run in.

- A transcript, which is going to be the most important - this is everything you've seen on the screen during the session, and a lot that was hidden.

The transcript file is actually a JSONL file (JSON "lines" format), so each line is an individual json object - makes it easy to keep concatenating new json content. Each entry (line) looks something like this:

JSON
```
❯ head -1 /Users/schacon/.claude/projects/-Users-schacon-projects-testing/eb5b0174-0555-4601-804e-672d68069c89.jsonl | jq
{
  "parentUuid": null,
  "isSidechain": false,
  "userType": "external",
  "cwd": "/Users/schacon/projects/testing",
  "sessionId": "eb5b0174-0555-4601-804e-672d68069c89",
  "version": "1.0.58",
  "gitBranch": "",
  "type": "user",
  "message": {
    "role": "user",
    "content": "add rick to the readme"
  },
  "uuid": "b4575262-5ecc-4188-abe3-82c4eef91120",
  "timestamp": "2025-07-23T15:00:55.015Z"
}

```

Another interesting thing to notice here is where it keeps these transcript files. If you go into `~/.claude/projects` you can see a list of every project where you've run Claude Code. Inside each project directory is a transcript file for every session you've done. It's actually pretty cool.

### Enough blah blah, let's write our auto-committing script

Now, there are a few different ways we could do this auto-committing script.

We could use the `UserPromptSubmit` to store the latest prompt in a tempfile and then commit using that as the message when we get a `Stop` call, but instead we're going to just run a single command at the `Stop` hook that figures out what the last prompt was from the transcript, then add all the files and commit.

So, let's change the `~/.claude/settings.json` to run a new script of ours and get that script to do all of that. Instead of the `ocascript` line, just point it at a script of yours. Let's say we put it in `~/bin/post_chat.rb`:

JSON
```
❯ cat ~/.claude/settings.json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/schacon/bin/post_chat.rb"
          }
        ]
      }
    ]
  }
}

```

Our new settings file, with our new Stop hook script

I am of course using Ruby here, both because it's the best language in the world, but also because it's pretty pseudo-code-y, so it should be easy to follow.

So, here is my script, which:

- Reads the JSON input from stdin and parses it

- Pulls out the transcript path and project directory

- Changes to the project directory

- Finds the last entry that was a user prompt

- Create temporary file with the message content

- Adds all the changed files to Git

- Runs a git commit

- Also (for fun), does a Mac desktop notification with the commit message

Check it out:

Pretty straightforward. Now every time a chat session ends, you should automatically get a commit to whatever branch you're on.

## Version Two, Beast Mode: Multiple Branches

Now, this won't exactly work in all circumstances, but let's try to do something crazy, just for fun.

Let's see how close we can get to what GitButler does - figure out what files are changed *in parallel* *sessions* and commit only the changes in those files to independent branches.

The plan is:

- Every time a file is modified, we get a `PreToolUse` hook and session ID.

- Create a new index that is just for that session if it doesn't exist and populate it with the contents of the last commit on the active branch (`HEAD`), giving us a base.

- When a file is done being modified with `PostToolUse`, we will add it (and only it) to our session index.

- When a `Stop` is issued, we will commit that index's tree to a fake branch under `refs/heads/claude/<session-id>` so each session's histories are seperate.

Now, this will commit changes to the same file to both session's branches because we can't easily do partial hunk staging in the Git CLI (as we can in GitButler) but it's still pretty fun.

## Enough blah blah, let's write this beast

Instead of actually embedding the full files here, which I'm sure you don't want to read as it's quite repetitive, I'll just link a GitHub repo with the three files (`pre_tool_call.rb`, `post_tool_call.rb` and `stop_call.rb`) here:

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-21.31.25%25402x.png&w=3840&q=75)

Let's look at the interesting bits.

For the [`PreToolUse` call](https://github.com/schacon/cc-hooks-auto-commit/blob/main/pre_tool_call.rb), it gets the `stdin` data similar to the previous script, then does this:

RUBY
```
# Write index file if it's not there yet
index_dir = File.join(cwd, '.git', 'claude', 'indexes', session_id)
unless Dir.exist?(index_dir)
  FileUtils.mkdir_p(index_dir)

  index_file = File.join(index_dir, 'index')

  system("git read-tree --index-output=#{index_file} HEAD")

  base_commit = `git rev-parse HEAD`.strip
  File.write(File.join(index_dir, 'base_commit'), base_commit)
end

```

Pretty standard, though you need to use the `--index-output` version of `git read-tree` to initialize the index file with the contents of the last commit (`HEAD`). This will work even as we're doing other things in the working directory and other branches.

I'm also writing the current HEAD sha into a file called `base_commit`, which is sort of unnecessary as I'll just fall back to HEAD later, but it's nice maybe for posterity.

The next thing will be the [`PostToolUse` call](https://github.com/schacon/cc-hooks-auto-commit/blob/main/post_tool_call.rb), which is really simple - just find that index file again and run `git add` on whatever file was modified.

RUBY
```
# Construct path to the sessions index file
index_file = File.join(cwd, '.git', 'claude', 'indexes', session_id, 'index')

# Run git add on the file_path using the session-specific index
if File.exist?(index_file) && file_path
  system("GIT_INDEX_FILE=#{index_file} git add #{file_path}")
end

```

Notice that to make sure this goes into our new shadow index, we need to set the `GIT_INDEX_FILE` env variable so we don't stage in our actual working directory.

Finally, when the chat is finished, we get the [`Stop` call](https://github.com/schacon/cc-hooks-auto-commit/blob/main/stop_call.rb) and need to actually create the commit. This is a little more complicated.

First we create the branch name we know we want to commit to:

RUBY
```
branch_ref = "refs/heads/claude/#{session_id}"

```

Then we check if the branch already exists so we can use it as our parent if we need to, otherwise we use the HEAD:

RUBY
```
# Check if the branch exists
branch_exists = system("git show-ref --verify --quiet #{branch_ref}")

if branch_exists
  # Use the commit that the branch points to
  parent_commit = `git rev-parse #{branch_ref}`.strip
else
  # Use the base_commit file contents
  if File.exist?(base_commit_file)
    parent_commit = File.read(base_commit_file).strip
  else
    # Fallback to HEAD if base_commit file doesn't exist
    parent_commit = `git rev-parse HEAD`.strip
  end
end

```

Finally, we write the commit to our session branch without touching our current one:

RUBY
```
# Write the index tree
tree_sha = `GIT_INDEX_FILE=#{index_file} git write-tree`.strip

# Create temporary file with the message content
temp_file = Tempfile.new('commit_message')
temp_file.write(message_content)
temp_file.close

# Create commit using git commit-tree
commit_sha = `git commit-tree #{tree_sha} -p #{parent_commit} -F #{temp_file.path}`.strip

# Update the ref to point to the new commit
system("git update-ref #{branch_ref} #{commit_sha}")
temp_file.unlink

```

You may not know about `git write-tree` and `git commit-tree` and `git update-ref`, but essentially we're just doing the plumbing commands that write a tree object from the session shadow index we have, then manually create a commit object from that tree, parent and commit message, then finally update the branch reference with our new commit.

Finally, we need to tell Claude Code about these three hooks, so our `settings.json` file should now look something like [this](https://github.com/schacon/cc-hooks-auto-commit/blob/main/.claude/settings.json):

JSON
```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/bin/pre_tool_call.rb"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/bin/post_tool_call.rb"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/bin/stop_call.rb"
          }
        ]
      }
    ]
  }
}

```

Most of that is pretty straightforward, just three hooks instead of one. The one thing is the `matcher` entry on the tool use calls, which is set to `"Edit|MultiEdit|Write"`, meaning that it will only get called on file modifications. You can also set this value to things like `Read`, `Bash`, `Grep`, etc - but for the purposes of what we're doing here, we're only interested in file changes.

## What does it look like?

Ok, so let say we have this in place and do some chat sessions now. What does this end up looking like?

Let's say that we go into a simple project, fire up `claude` in each, and ask one to create a file that lists directory contents and the other to show disk usage:

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-21.57.55%25402x.png&w=3840&q=75)

However, running the `list_dir.py` script, I don't like the file icons it put in, so I'll ask it to remove them.

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-21.59.48%25402x.png&w=3840&q=75)

Great, done. So now what does Git look like?

```
❯ git branch
  claude/35560697-eb5b-4bc3-92bf-77536b1dda8f
  claude/9a326bde-78a1-4e6b-abac-dede8721d11f
* main

```

Hey! We have two new branches, one for each session. Let's check them out:

![](/_next/image?url=https%3A%2F%2Fd2m1ukvwmu7gz4.cloudfront.net%2Fimages%2Fimages-2025-07-CleanShot-2025-07-23-at-22.00.59%25402x.png&w=3840&q=75)

Nice - on the first branch we have two commits - one that adds the `list_dir.py` file and another that modifies it, and both with the correct prompt. The second branch just has the one commit that adds the `disk_usage.sh` file, again with the prompt.

Now, in theory, we could push these to GitHub with something like:

```
$ git push origin claude/35560697-eb5b-4bc3-92bf-77536b1dda8f:list-dir

```

Or turn it into a normal branch locally, or whatever. The work of our two parallel Claude Code sessions are isolated into different branches.

It's worth noting here that since nothing has been committed to the branch we're actually on, the working directory looks dirty. You would need to stash or clean before you could merge these branches back in.

Anyhow, fun exercise.

## Fin

That's it for now. A little Git abuse is always fun on a Thursday. Hopefully you've also learned a bit about Claude Code hooks and what you could possibly do with them.

If you want to do the "splitting sessions into branches" thing, but in a way that is much better and simpler, try out [GitButler's Claude Code hooks](https://docs.gitbutler.com/features/ai-integration/claude-code-hooks) instead of using this method, I promise it's much more robust.
[![Scott Chacon](/_next/image?url=%2Fprofiles%2Fschacon.jpg&w=256&q=75)](/author/schacon)
Written by [Scott Chacon](/author/schacon)

Scott Chacon is a co-founder of GitHub and GitButler, where he builds innovative tools for modern version control. He has authored Pro Git and spoken globally on Git and software collaboration.
[Website](https://scottchacon.com)|[X](https://twitter.com/chacon)
### Table *of* Contents

- [Claude Code Hooks](#claude-code-hooks)
- [A simple example](#a-simple-example)
- [How to do a Desktop notification on Mac](#how-to-do-a-desktop-notification-on-mac)
- [Adding the hook](#adding-the-hook)
- [A massively complicated example](#a-massively-complicated-example)
- [Version One: Auto Committing](#version-one-auto-committing)
- [Enough blah blah, let's write our auto-committing script](#enough-blah-blah-let-s-write-our-auto-committing-script)
- [Version Two, Beast Mode: Multiple Branches](#version-two-beast-mode-multiple-branches)
- [Enough blah blah, let's write this beast](#enough-blah-blah-let-s-write-this-beast)
- [What does it look like?](#what-does-it-look-like)
- [Fin](#fin)

### *Related* articles

- [Deep Dive into the new Cursor Hooks](/cursor-hooks-deep-dive)
by Scott Chacon * - 6 min read*

- [Git Mini Summit 2025 Videos](/git-mini-summit-2025)
by Scott Chacon * - 2 min read*

- [Git Worktrees and GitButler](/git-worktrees)
by Scott Chacon * - 5 min read*

## More to *Read*
[![Simplifying Git by Using GitButler](https://gitbutler-docs-images-public.s3.us-east-1.amazonaws.com/simplify-git.webp)
### Simplifying Git by Using GitButler
This monthby PJ Hagerty7 min read
Git is great - and has been for twenty years. But in that time, how many of us have advanced our git skills? Most of us know about five or six commands: clone, status, push/pull, add, commit, branch, and checkout.
](/simplifying-git)[![Introducing the GitButler CLI](https://gitbutler-docs-images-public.s3.us-east-1.amazonaws.com/introducing-cli.webp)
### Introducing the GitButler CLI
This monthby Scott Chacon5 min read
Now in technical preview, the new GitButler CLI brings all the power of GitButler to your command line
](/but-cli)[![GitButler 0.19 - "Commander Keen"](https://gitbutler-docs-images-public.s3.us-east-1.amazonaws.com/release-0.19.webp)
### GitButler 0.19 - "Commander Keen"
This monthby Scott Chacon2 min read
GitButler 0.19 is out, now shipping with a CLI, improved diffing, improved agentic help and more!
](/gitbutler-0-19)
## Stay in the *Loop*

Subscribe to get fresh updates, insights, and
exclusive content delivered straight to your inbox.
No spam, just great reads. 🚀
Subscribe