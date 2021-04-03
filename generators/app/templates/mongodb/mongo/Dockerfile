FROM mongo:<%= mongodb %>

ENV WAIT_VERSION 2.7.3
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/$WAIT_VERSION/wait /root/wait
ADD entry.sh /root/entry.sh
RUN chmod +x /root/wait && \
    chmod +x /root/entry.sh && \
    mkdir /root/backup

ENTRYPOINT ["/root/entry.sh"]
