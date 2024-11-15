function parseRedditDiscussion(redditData) {
    // Initialize result object
    const discussion = {
        post: {},
        comments: []
    };

    try {
        // Get main post data
        const mainPost = redditData[0].data.children[0].data;
        discussion.post = {
            title: mainPost.title,
            content: mainPost.selftext,
            author: mainPost.author,
            created: new Date(mainPost.created_utc * 1000),
            score: mainPost.score
        };

        // Get comments
        const comments = redditData[1].data.children;
        discussion.comments = comments.map(comment => ({
            author: comment.data.author,
            content: comment.data.body,
            score: comment.data.ups,
            created: new Date(comment.data.created_utc * 1000),
            replies: comment.data.replies ? parseReplies(comment.data.replies) : []
        }));

        return discussion;
    } catch (error) {
        console.error('Error parsing Reddit data:', error);
        return null;
    }
}

// Helper function to parse nested replies
function parseReplies(replies) {
    if (!replies || !replies.data || !replies.data.children) {
        return [];
    }

    return replies.data.children.map(reply => ({
        author: reply.data.author,
        content: reply.data.body,
        score: reply.data.ups,
        created: new Date(reply.data.created_utc * 1000),
        replies: reply.data.replies ? parseReplies(reply.data.replies) : []
    }));
}

function convertToMarkdown(redditData) {
    try {
        const discussion = parseRedditDiscussion(redditData);
        if (!discussion) return '';

        let markdown = '';

        // Add post title and content
        markdown += `# ${discussion.post.title}\n\n`;
        markdown += `${discussion.post.content}\n\n`;
        markdown += `*Posted by u/${discussion.post.author} on ${discussion.post.created.toLocaleDateString()}*\n\n`;
        markdown += `---\n\n`;

        // Add comments
        markdown += formatComments(discussion.comments);

        return markdown;
    } catch (error) {
        console.error('Error converting to markdown:', error);
        return '';
    }
}

function formatComments(comments, depth = 0) {
    let markdown = '';
    const indent = '  '.repeat(depth);

    comments.forEach(comment => {
        if (comment.author === '[deleted]') return;

        // Add comment content
        markdown += `${indent}**u/${comment.author}** `;
        markdown += `*(${comment.score} points)*\n`;
        markdown += `${indent}${comment.content}\n\n`;

        // Add replies recursively
        if (comment.replies && comment.replies.length > 0) {
            markdown += formatComments(comment.replies, depth + 1);
        }
    });

    return markdown;
}

// Usage example:
// const markdown = convertToMarkdown(redditJsonData);
// console.log(markdown);

async function getRedditJsonData(url) {
    // If the url doesn't contain '.json', add it
    if (!url.endsWith('.json')) {
        url += '.json';
    }

    const response = await fetch(url);
    const data = await response.json();

    return data;
}

async function getRedditMarkdownText(url) {
    const data = await getRedditJsonData(url);
    return convertToMarkdown(data);
}


module.exports = {
    getRedditMarkdownText
};
